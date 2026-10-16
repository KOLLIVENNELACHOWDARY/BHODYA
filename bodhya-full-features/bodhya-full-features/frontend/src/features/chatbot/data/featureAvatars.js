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
import alarms from "../assets/features/alarms.png";
import notifications from "../assets/features/notifications.png";
import studyplan from "../assets/features/studyplan.png";
import focus from "../assets/features/focus.png";
import music from "../assets/features/music.png";
import shield from "../assets/features/shield.png";
import forest from "../assets/features/forest.png";
import journal from "../assets/features/journal.png";
import guardian from "../assets/features/guardian.png";

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
  alarms: alarms,
  notifications: notifications,
  studyplan: studyplan,
  focus: focus,
  music: music,
  shield: shield,
  forest: forest,
  journal: journal,
  guardian: guardian,
};

export function featureAvatar(id) {
  return FEATURE_AVATARS[id] || null;
}
