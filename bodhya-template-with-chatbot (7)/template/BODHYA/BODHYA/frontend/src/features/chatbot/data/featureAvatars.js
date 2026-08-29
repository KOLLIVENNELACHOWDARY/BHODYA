// ---------- Feature kawaii avatars: each feature gets its own relevant mascot ----------
// Used on the circular tour wheel (and feature pages).

import dashboard from "../assets/features/dashboard.png";
import quiz from "../assets/features/quiz.png";
import notesquiz from "../assets/features/notesquiz.png";
import tests from "../assets/features/tests.png";
import planner from "../assets/features/planner.png";
import todo from "../assets/features/todo.png";
import time from "../assets/features/time.png";
import knowledge from "../assets/features/knowledge.png";
import tutor from "../assets/features/tutor.png";
import revision from "../assets/features/revision.png";
import rag from "../assets/features/rag.png";
import rooms from "../assets/features/rooms.png";
import rewards from "../assets/features/rewards.png";
import reviews from "../assets/features/reviews.png";
import safety from "../assets/features/safety.png";
import profile from "../assets/features/profile.png";

export const FEATURE_AVATARS = {
  home: dashboard,
  quiz: quiz,
  notesquiz: notesquiz,
  tests: tests,
  planner: planner,
  todo: todo,
  time: time,
  knowledge: knowledge,
  tutor: tutor,
  revision: revision,
  rag: rag,
  rooms: rooms,
  rewards: rewards,
  reviews: reviews,
  safety: safety,
  profile: profile,
};

export function featureAvatar(id) {
  return FEATURE_AVATARS[id] || null;
}
