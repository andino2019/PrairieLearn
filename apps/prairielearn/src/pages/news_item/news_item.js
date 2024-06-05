// @ts-check
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

import { HttpStatusError } from '@prairielearn/error';
import { callRow, loadSqlEquiv, queryOptionalRow } from '@prairielearn/postgres';

import { NewsItemSchema } from '../../lib/db-types.js';

import { NewsItem, NewsItemRowSchema } from './news_item.html.js';

const sql = loadSqlEquiv(import.meta.url);
const router = Router();

router.get(
  '/:news_item_id(\\d+)',
  asyncHandler(async (req, res) => {
    const newsItem = await queryOptionalRow(
      sql.select_news_item_for_read,
      {
        news_item_id: req.params.news_item_id,
        user_id: res.locals.authn_user.user_id,
        course_instance_id: res.locals.course_instance?.id,
        course_id: res.locals.course?.id,
      },
      NewsItemRowSchema,
    );
    if (newsItem == null) {
      throw new HttpStatusError(404, 'Invalid news item ID');
    }

    const indexFilename = path.join(
      import.meta.dirname,
      '..',
      '..',
      'news_items',
      newsItem.directory,
      'index.html',
    );
    const newsItemHtml = await fs.readFile(indexFilename, 'utf8');

    const userIsInstructor = await callRow(
      'users_is_instructor_in_any_course',
      [res.locals.authn_user.user_id],
      z.boolean(),
    );

    res.send(NewsItem({ resLocals: res.locals, newsItem, newsItemHtml, userIsInstructor }));
  }),
);

router.get(
  '/:news_item_id(\\d+)/*',
  asyncHandler(async (req, res) => {
    const filename = req.params[0];
    const newsItem = await queryOptionalRow(
      sql.select_news_item,
      { news_item_id: req.params.news_item_id },
      NewsItemSchema,
    );
    if (newsItem == null) {
      throw new HttpStatusError(404, 'Invalid news item ID');
    }

    const newsItemDir = path.join(
      import.meta.dirname,
      '..',
      '..',
      'news_items',
      newsItem.directory,
    );

    res.sendFile(filename, { root: newsItemDir });
  }),
);

export default router;
