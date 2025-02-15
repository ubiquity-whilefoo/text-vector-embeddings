import { Context } from "../../src/types";
import { Comment } from "../../src/adapters/supabase/helpers/comment";
import { STRINGS } from "./strings";

export interface CommentMock {
  id: string;
  plaintext: string | null;
  author_id: number;
  payload?: Record<string, unknown> | null;
  type?: string;
  issue_id?: string;
  embedding: number[];
}

export function createMockAdapters(context: Context) {
  const commentMap: Map<string, CommentMock> = new Map();
  return {
    supabase: {
      comment: {
        createComment: jest.fn(
          async (
            plaintext: string | null,
            commentNodeId: string,
            authorId: number,
            payload: Record<string, unknown> | null,
            isPrivate: boolean,
            issueId: string
          ) => {
            if (commentMap.has(commentNodeId)) {
              throw new Error("Comment already exists");
            }
            const embedding = await context.adapters.voyage.embedding.createEmbedding(plaintext);
            if (isPrivate) {
              plaintext = null;
            }
            commentMap.set(commentNodeId, { id: commentNodeId, plaintext, author_id: authorId, embedding, issue_id: issueId });
          }
        ),
        updateComment: jest.fn(
          async (
            plaintext: string | null,
            commentNodeId: string,
            authorId: number,
            payload: Record<string, unknown> | null,
            isPrivate: boolean,
            issueId: string
          ) => {
            if (!commentMap.has(commentNodeId)) {
              throw new Error(STRINGS.COMMENT_DOES_NOT_EXIST);
            }
            const originalComment = commentMap.get(commentNodeId);
            if (!originalComment) {
              throw new Error(STRINGS.COMMENT_DOES_NOT_EXIST);
            }
            const embedding = await context.adapters.voyage.embedding.createEmbedding(plaintext);
            if (isPrivate) {
              plaintext = null;
            }
            commentMap.set(commentNodeId, { id: issueId, plaintext, author_id: authorId, embedding, payload });
          }
        ),
        deleteComment: jest.fn(async (commentNodeId: string) => {
          if (!commentMap.has(commentNodeId)) {
            throw new Error(STRINGS.COMMENT_DOES_NOT_EXIST);
          }
          commentMap.delete(commentNodeId);
        }),
        getComment: jest.fn(async (commentNodeId: string) => {
          if (!commentMap.has(commentNodeId)) {
            throw new Error(STRINGS.COMMENT_DOES_NOT_EXIST);
          }
          return commentMap.get(commentNodeId);
        }),
      } as unknown as Comment,
    },
    voyage: {
      embedding: {
        createEmbedding: jest.fn(async (text: string) => {
          if (text && text.length > 0) {
            return new Array(3072).fill(1);
          }
          return new Array(3072).fill(0);
        }),
      } as unknown as number[],
    },
  };
}
