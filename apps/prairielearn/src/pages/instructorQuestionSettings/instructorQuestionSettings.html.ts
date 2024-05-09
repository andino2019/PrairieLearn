import { escapeHtml, html, unsafeHtml } from '@prairielearn/html';
import { renderEjs } from '@prairielearn/html-ejs';
import { z } from 'zod';

import { Modal } from '../../components/Modal.html';
import { AssessmentSchema, AssessmentSetSchema, IdSchema } from '../../lib/db-types';
import { CourseWithPermissions } from '../../models/course';
import { isEnterprise } from '../../lib/license';
import { idsEqual } from '../../lib/id';

export const SelectedAssessmentsSchema = z.object({
  short_name: z.string(),
  long_name: z.string(),
  course_instance_id: IdSchema,
  assessments: z.array(
    z.object({
      assessment_id: IdSchema,
      color: AssessmentSetSchema.shape.color,
      label: AssessmentSetSchema.shape.abbreviation,
      title: AssessmentSchema.shape.title,
      type: AssessmentSchema.shape.type,
    }),
  ),
});
type SelectedAssessments = z.infer<typeof SelectedAssessmentsSchema>;

export const SharingSetRowSchema = z.object({
  id: IdSchema,
  name: z.string(),
  in_set: z.boolean(),
});
type SharingSetRow = z.infer<typeof SharingSetRowSchema>;

export function InstructorQuestionSettings({
  resLocals,
  questionTestPath,
  questionTestCsrfToken,
  questionGHLink,
  qids,
  assessmentsWithQuestion,
  sharingEnabled,
  sharingSetsIn,
  sharingSetsOther,
  editableCourses,
  infoPath,
}: {
  resLocals: Record<string, any>;
  questionTestPath: string;
  questionTestCsrfToken: string;
  questionGHLink: string | null;
  qids: string[];
  assessmentsWithQuestion: SelectedAssessments[];
  sharingEnabled: boolean;
  sharingSetsIn: SharingSetRow[];
  sharingSetsOther: SharingSetRow[];
  editableCourses: CourseWithPermissions[];
  infoPath: string;
}) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        ${renderEjs(__filename, "<%- include('../partials/head'); %>", {
          pageNote: resLocals.question.qid,
          ...resLocals,
        })}
        <style>
          .popover {
            max-width: 50%;
          }
        </style>
      </head>
      <body>
        <script>
          $(function () {
            $('[data-toggle="popover"]').popover({
              sanitize: false,
            });
          });
        </script>
        <script>
          $(function () {
            $('[data-toggle="tooltip"]').tooltip();
          });
        </script>

        ${renderEjs(__filename, "<%- include('../partials/navbar'); %>", resLocals)}
        <main id="content" class="container">
          ${renderEjs(
            __filename,
            "<%- include('../partials/questionSyncErrorsAndWarnings'); %>",
            resLocals,
          )}
          <div class="card mb-4">
            <div class="card-header bg-primary text-white d-flex">Question Settings</div>
            <div class="card-body">
              <form>
                <div class="form-group">
                  <h2 class="h4">General</h2>
                  <label for="title">Title</label>
                  <input
                    type="text"
                    class="form-control"
                    id="title"
                    name="title"
                    value="${resLocals.question.title}"
                    disabled
                  />
                  <small class="form-text text-muted">
                    The title of the question (e.g., "Add two numbers").
                  </small>
                </div>
                <div class="form-group">
                  <label for="qid">QID</label>
                  ${resLocals.authz_data.has_course_permission_edit &&
                  !resLocals.course.example_course
                    ? html`
                        <button
                          type="button"
                          class="btn btn-xs btn-secondary align-top ml-1"
                          id="changeQidButton"
                          data-toggle="popover"
                          data-container="body"
                          data-html="true"
                          data-placement="auto"
                          title="Change QID"
                          data-content="${renderEjs(
                            __filename,
                            "<%= include('../partials/changeIdForm') %>",
                            {
                              id_label: 'QID',
                              buttonID: 'changeQidButton',
                              id_old: resLocals.question.qid,
                              ids: qids,
                              ...resLocals,
                            },
                          )}"
                          data-trigger="click"
                        >
                          <i class="fa fa-i-cursor"></i>
                          <span>Change QID</span>
                        </button>
                      `
                    : ''}
                  ${questionGHLink
                    ? html`<a target="_blank" href="${questionGHLink}"> view on GitHub </a>`
                    : ''}
                  <input
                    type="text"
                    class="form-control"
                    id="qid"
                    name="qid"
                    value="${resLocals.question.qid}"
                    disabled
                  />
                  <small class="form-text text-muted">
                    This is a unique identifier for the question. (e.g., "addNumbers")
                  </small>
                </div>
                <div>
                  <h2 class="h4">Topic</h2>
                  <div class="list-group">
                    <div class="list-group-item d-flex align-items-center">
                      <span
                        class="badge color-${resLocals.topic.color}"
                        data-toggle="tooltip"
                        data-html="true"
                        title="${unsafeHtml(resLocals.topic.description)}"
                        >${resLocals.topic.name}</span
                      >
                    </div>
                  </div>
                </div>
                <hr />
                <div>
                  <h2 class="h4">Tags</h2>
                  <div>${TagRows({ tags: resLocals.tags })}</div>
                </div>
                <hr />
                <div>
                  <h2 class="h4">Assessments</h2>
                  <div>
                    ${AssessmentRows({
                      assessmentsWithQuestion,
                    })}
                  </div>
                </div>
              </form>
              ${sharingEnabled
                ? html`
                    <hr />
                    <div>
                      <h2 class="h4">Sharing</h2>
                      <div data-testid="shared-with">
                        ${QuestionSharing({
                          questionSharedPublicly: resLocals.question.shared_publicly,
                          sharingSetsIn,
                          hasCoursePermissionOwn: resLocals.authz_data.has_course_permission_own,
                          sharingSetsOther,
                          csrfToken: resLocals.__csrf_token,
                          qid: resLocals.question.qid,
                        })}
                      </div>
                    </div>
                    <hr />
                  `
                : ''}
              ${resLocals.question.type === 'Freeform' &&
              resLocals.question.grading_method !== 'External' &&
              resLocals.authz_data.has_course_permission_view
                ? html`
                    <div>
                      <h2 class="h4">Tests</h2>
                      <div>
                        ${QuestionTestsForm({
                          questionTestPath,
                          questionTestCsrfToken,
                        })}
                      </div>
                    </div>
                  `
                : ''}
              ${resLocals.authz_data.has_course_permission_view
                ? resLocals.authz_data.has_course_permission_edit &&
                  !resLocals.course.example_course
                  ? html`
                      <hr />
                      <a
                        data-testid="edit-question-configuration-link"
                        href="${resLocals.urlPrefix}/question/${resLocals.question
                          .id}/file_edit/${infoPath}"
                      >
                        Edit question configuration
                      </a>
                      in <code>info.json</code>
                    `
                  : html`
                      <hr />
                      <a
                        href="${resLocals.urlPrefix}/question/${resLocals.question
                          .id}/file_view/${infoPath}"
                      >
                        View course configuration
                      </a>
                      in <code>info.json</code>
                    `
                : ''}
            </div>
            ${(editableCourses.length > 0 && resLocals.authz_data.has_course_permission_view) ||
            (resLocals.authz_data.has_course_permission_edit && !resLocals.course.example_course)
              ? html`
                  <div class="card-footer">
                    <div class="row">
                      ${editableCourses.length > 0 &&
                      resLocals.authz_data.has_course_permission_view &&
                      resLocals.question.course_id === resLocals.course.id
                        ? html`
                            <div class="col-auto">
                              <button
                                type="button"
                                class="btn btn-sm btn-primary"
                                id="copyQuestionButton"
                                data-toggle="popover"
                                data-container="body"
                                data-html="true"
                                data-placement="auto"
                                title="Copy this question"
                                data-content="${escapeHtml(
                                  CopyForm({
                                    csrfToken: resLocals.__csrf_token,
                                    exampleCourse: resLocals.course.example_course,
                                    editableCourses,
                                    courseId: resLocals.course.id,
                                    buttonId: 'copyQuestionButton',
                                  }),
                                )}"
                                data-trigger="manual"
                                onclick="$(this).popover('show')"
                              >
                                <i class="fa fa-clone"></i>
                                <span>Make a copy of this question</span>
                              </button>
                            </div>
                          `
                        : ''}
                      ${resLocals.authz_data.has_course_permission_edit &&
                      !resLocals.course.example_course
                        ? html`
                            <div class="col-auto">
                              <button
                                class="btn btn-sm btn-primary"
                                id
                                href="#"
                                data-toggle="modal"
                                data-target="#deleteQuestionModal"
                              >
                                <i class="fa fa-times" aria-hidden="true"></i> Delete this question
                              </button>
                            </div>
                            ${DeleteQuestionModal({
                              qid: resLocals.question.qid,
                              assessmentsWithQuestion,
                              csrfToken: resLocals.__csrf_token,
                            })}
                          `
                        : ''}
                    </div>
                  </div>
                `
              : ''}
          </div>
        </main>
      </body>
    </html>
  `.toString();
}

function CopyForm({
  csrfToken,
  exampleCourse,
  editableCourses,
  courseId,
  buttonId,
}: {
  csrfToken: string;
  exampleCourse: boolean;
  editableCourses: CourseWithPermissions[];
  courseId: string;
  buttonId: string;
}) {
  return html`
    <form name="copy-question-form" class="needs-validation" method="POST" novalidate>
      <input type="hidden" name="__action" value="copy_question" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <div class="form-group">
        <label for="to-course-id-select">
          The copied question will be added to the following course:
        </label>
        <select class="form-control" id="to-course-id-select" name="to_course_id" required>
          ${exampleCourse
            ? html`<option hidden disabled selected value>-- select a course --</option>`
            : ''}
          ${editableCourses.map((c) => {
            return html`
              <option value="${c.id}" ${idsEqual(c.id, courseId) ? 'selected' : ''}>
                ${c.short_name}
              </option>
            `;
          })}
        </select>
        <div class="invalid-feedback" id="invalidIdMessage"></div>
      </div>
      <div class="text-right">
        <button type="button" class="btn btn-secondary" onclick="$('#${buttonId}').popover('hide')">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </form>

    <script>
      $(function () {
        const validateCourse = function () {
          let element = $('select[name="to_course_id"]');
          let elementDOM = element.get(0);

          elementDOM.setCustomValidity('');
          if (elementDOM.validity.valueMissing) {
            $('#invalidIdMessage').text('Please choose a course');
          } else {
            $('#invalidIdMessage').text('');
          }
        };

        $('input[name="to_course_id"]').on('input', validateCourse);
        $('input[name="to_course_id"]').on('change', validateCourse);

        $('form[name="copy-question-form"]').submit(function (event) {
          validateCourse();
          if ($(this).get(0).checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
          }
          $(this).addClass('was-validated');
        });
      });
    </script>
  `;
}

function PubliclyShareModal({ csrfToken, qid }: { csrfToken: string; qid: string }) {
  return Modal({
    id: 'publiclyShareModal',
    title: 'Confirm Publicly Share Question',
    body: html`
      <p>Are you sure you want to publicly share this question?</p>
      <p>
        Once this question is publicly shared, anyone will be able to view it or use it as a part of
        their course. This operation cannot be undone.
      </p>
      ${isEnterprise()
        ? html`
            <p>
              You retain full ownership of all shared content as described in the
              <a href="https://www.prairielearn.com/legal/terms#2-user-content" target="_blank"
                >Terms of Service</a
              >. To allow PrairieLearn to share your content to other users you agree to the
              <a
                href="https://www.prairielearn.com/legal/terms#3-user-content-license-grant"
                target="_blank"
                >User Content License Grant</a
              >.
            </p>
          `
        : ''}
    `,
    footer: html`
      <input type="hidden" name="__action" value="share_publicly" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
      <button class="btn btn-primary" type="submit">Publicly Share "${qid}"</button>
    `,
  });
}

function DeleteQuestionModal({
  qid,
  assessmentsWithQuestion,
  csrfToken,
}: {
  qid: string;
  assessmentsWithQuestion: SelectedAssessments[];
  csrfToken: string;
}) {
  return Modal({
    id: 'deleteQuestionModal',
    title: 'Delete question',
    body: html`
      <p>
        Are you sure you want to delete the question
        <strong>${qid}</strong>?
      </p>
      ${assessmentsWithQuestion.length
        ? html`
            <p>It is included by these assessments:</p>
            <ul class="list-group my-4">
              ${assessmentsWithQuestion.map((a_with_q) => {
                return html`
                  <li class="list-group-item">
                    <h6>${a_with_q.short_name}</h6>
                    ${a_with_q.assessments.map(function (a) {
                      return html`
                        <a
                          href="/pl/course_instance/${a_with_q.course_instance_id}/instructor/assessment/${a.assessment_id}"
                          class="badge color-${a.color} color-hover"
                        >
                          ${a.label}
                        </a>
                      `;
                    })}
                  </li>
                `;
              })}
            </ul>
            <p>
              So, if you delete it, you will be unable to sync your course content to the database
              until you either remove the question from these assessments or create a new question
              with the same QID.
            </p>
          `
        : ''}
    `,
    footer: html`
      <input type="hidden" name="__action" value="delete_question" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
      <button type="submit" class="btn btn-danger">Delete</button>
    `,
  });
}

function QuestionTestsForm({
  questionTestPath,
  questionTestCsrfToken,
}: {
  questionTestPath: string;
  questionTestCsrfToken: string;
}) {
  return html`
    <form name="question-tests-form" method="POST" action="${questionTestPath}">
      <input type="hidden" name="__csrf_token" value="${questionTestCsrfToken}" />
      <button class="btn btn-sm btn-outline-primary" name="__action" value="test_once">
        Test once with full details
      </button>
      <button class="btn btn-sm btn-outline-primary" name="__action" value="test_100">
        Test 100 times with only results
      </button>
    </form>
  `;
}

function QuestionSharing({
  questionSharedPublicly,
  sharingSetsIn,
  hasCoursePermissionOwn,
  sharingSetsOther,
  csrfToken,
  qid,
}: {
  questionSharedPublicly: boolean;
  sharingSetsIn: SharingSetRow[];
  hasCoursePermissionOwn: boolean;
  sharingSetsOther: SharingSetRow[];
  csrfToken: string;
  qid: string;
}) {
  if (questionSharedPublicly) {
    return html`
      <div class="row">
        <div class="col-1">
          <div class="badge color-green3">Public</div>
        </div>
        <div class="col-auto">This question is publicly shared.</div>
      </div>
    `;
  }

  return html`
    ${sharingSetsIn.length === 0
      ? html`<small class="text-muted px-3">This question is not being shared</small>`
      : html`
          <small class="text-muted"
            >Shared With:
            ${sharingSetsIn.map(function (sharing_set) {
              return html` <span class="badge color-gray1"> ${sharing_set?.name} </span> `;
            })}
          </small>
        `}
    ${hasCoursePermissionOwn
      ? html`
          ${sharingSetsOther.length > 0
            ? html`
                <form name="sharing-set-add" method="POST" class="d-inline">
                  <input type="hidden" name="__action" value="sharing_set_add" />
                  <input type="hidden" name="__csrf_token" value="${csrfToken}" />
                  <div class="btn-group btn-group-sm" role="group">
                    <button
                      id="addSharingSet"
                      type="button"
                      class="btn btn-sm btn-outline-dark dropdown-toggle"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      Add...
                    </button>
                    <div class="dropdown-menu" aria-labelledby="addSharingSet">
                      ${sharingSetsOther.map(function (sharing_set) {
                        return html`
                          <button
                            class="dropdown-item"
                            name="unsafe_sharing_set_id"
                            value="${sharing_set.id}"
                          >
                            ${sharing_set.name}
                          </button>
                        `;
                      })}
                    </div>
                  </div>
                </form>
              `
            : ''}
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
            data-toggle="modal"
            data-target="#publiclyShareModal"
          >
            Share Publicly
          </button>
          ${PubliclyShareModal({
            csrfToken,
            qid,
          })}
        `
      : ''}
  `;
}

function TagRows({ tags }) {
  if (!tags || tags.length === 0) {
    return html` <small class="text-muted"> This question does not have any tags. </small>`;
  } else {
    return html`
      <div class="list-group">
        <div class="list-group-item ">
          ${tags.map((tag) => {
            return html`
              <span
                class="badge color-${tag.color}"
                style="white-space: unset; word-break: break-all"
                data-toggle="tooltip"
                title="${unsafeHtml(tag.description)}"
              >
                ${tag.name}
              </span>
            `;
          })}
        </div>
      </div>
    `;
  }
}

function AssessmentRows({ assessmentsWithQuestion }) {
  if (assessmentsWithQuestion.length === 0) {
    return html`<small class="text-muted text-center"
      >This question is not included in any assessments.</small
    >`;
  } else {
    return assessmentsWithQuestion.map((courseInstance) => {
      return html`
        <div class="card pb-2 mb-2">
          <div class="h6 card-header">
            ${courseInstance.long_name} (${courseInstance.short_name})
          </div>
          <div class="card-body">
            ${courseInstance.assessments.map((assessment) => {
              return html`
                <a
                  href="/pl/course_instance/${courseInstance.course_instance_id}/instructor/assessment/${assessment.assessment_id}"
                  class="badge color-${assessment.color}"
                >
                  ${assessment.label}
                </a>
              `;
            })}
          </div>
        </div>
      `;
    });
  }
}
