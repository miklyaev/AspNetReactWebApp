import { GoalsPage } from "./components/GoalsPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { TasksPage } from "./components/TasksPage";
import { TimeEntriesPage } from "./components/TimeEntriesPage";

const AppRoutes = [
  {
    index: true,
    element: <GoalsPage />
  }, {
    path: '/goals',
    element: <GoalsPage />
  },
  {
    path: '/projects',
    element: <ProjectsPage />
  },
  {
    path: '/tasks',
    element: <TasksPage />
  },
  {
    path: '/time',
    element: <TimeEntriesPage />
  }
];

export default AppRoutes;
