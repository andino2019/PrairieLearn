import { loadSqlEquiv, queryAsync, queryOptionalRow, queryRows } from '@prairielearn/postgres';

import { IdSchema, SubmissionSchema, Variant, VariantSchema } from '../lib/db-types.js';

const sql = loadSqlEquiv(import.meta.url);

export async function selectVariantById(variant_id: string): Promise<Variant | null> {
  return queryOptionalRow(sql.select_variant_by_id, { variant_id }, VariantSchema);
}

export async function resetVariantsForAssessmentQuestion({
  assessment_id,
  unsafe_assessment_question_id,
  authn_user_id,
}: {
  assessment_id: string;
  unsafe_assessment_question_id: string;
  authn_user_id: string;
}) {
  await queryAsync(sql.reset_variants_for_assessment_question, {
    assessment_id,
    unsafe_assessment_question_id,
    authn_user_id,
  });
}

export async function resetVariantsForInstanceQuestion({
  assessment_instance_id,
  unsafe_instance_question_id,
  authn_user_id,
}: {
  assessment_instance_id: string;
  unsafe_instance_question_id: string;
  authn_user_id: string;
}) {
  await queryAsync(sql.reset_variants_for_instance_question, {
    assessment_instance_id,
    unsafe_instance_question_id,
    authn_user_id,
  });
}

export async function selectVariantsByInstanceQuestion({
  assessment_instance_id,
  instance_question_id,
}: {
  assessment_instance_id: string;
  instance_question_id?: string;
}) {
  return await queryRows(
    sql.select_variant_by_instance_question_id,
    { assessment_instance_id, instance_question_id },
    VariantSchema.extend({
      instance_question_id: IdSchema, // Since only variants assigned to instance questions are returned, this is never null.
      max_submission_score: SubmissionSchema.shape.score.unwrap(),
    }),
  );
}
