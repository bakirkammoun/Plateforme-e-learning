import { RouteObject, createBrowserRouter } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import AuthLayout from "../layout/AuthLayout";
import SignIn from "../pages/AuthPages/SignIn";
import SignUp from "../pages/AuthPages/SignUp";
import Blank from "../pages/Blank";
import Calendar from "../pages/Calendar";
import DashboardStats from "../pages/Dashboard/DashboardStats";
import GlobalStats from "../pages/Statistics/GlobalStats";
import Events from "../pages/Events/Events";
import EventDetails from "../pages/Events/EventDetails";
import EventEdit from "../pages/Events/EventEdit";
import NotFound from "../pages/OtherPage/NotFound";
import UserManagement from "../pages/Tables/BasicTables";
import Alerts from "../pages/UiElements/Alerts";
import Avatars from "../pages/UiElements/Avatars";
import Badges from "../pages/UiElements/Badges";
import Buttons from "../pages/UiElements/Buttons";
import Images from "../pages/UiElements/Images";
import Videos from "../pages/UiElements/Videos";
import UserProfiles from "../pages/UserProfiles";
import FormationForm from "../pages/Formations/FormationForm";
import FormationsList from "../pages/Formations/FormationsList";
import FormationDetails from "../pages/Formations/FormationDetails";
import FormationEdit from "../pages/Formations/FormationEdit";
import StudentDetails from '../pages/Users/StudentDetails';
import InstructorDetails from '../pages/Users/InstructorDetails';
import InstructorSupervision from '../pages/Instructors/InstructorSupervision';
import PaymentManagement from "../pages/Payments/PaymentManagement";
import Overview from "../pages/Overview/Overview";
import Gallery from "../pages/Gallery/Gallery";
import Certificate from "../pages/Certificates";
import QuizList from "../pages/Certificates/QuizList";
import AddUser from '../pages/Users/AddUser';
import EnrollmentsManagement from '../pages/Enrollments/EnrollmentsManagement';
import Archives from "../pages/Archives/Archives";
import AddCategory from '../pages/Formations/AddCategory';
import { ROUTES } from "./config";

const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/",
        element: <SignIn />
      },
      {
        path: ROUTES.AUTH.SIGNIN,
        element: <SignIn />
      },
      {
        path: ROUTES.AUTH.SIGNUP,
        element: <SignUp />
      }
    ]
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardStats />
      },
      {
        path: ROUTES.STATISTICS,
        element: <GlobalStats />
      },
      {
        path: ROUTES.PROFILE,
        element: <UserProfiles />
      },
      {
        path: ROUTES.CALENDAR,
        element: <Calendar />
      },
      {
        path: ROUTES.EVENTS.LIST,
        element: <Events />
      },
      {
        path: ROUTES.EVENTS.DETAILS,
        element: <EventDetails />
      },
      {
        path: ROUTES.EVENTS.EDIT,
        element: <EventEdit />
      },
      {
        path: "/blank",
        element: <Blank />
      },
      {
        path: ROUTES.FORMATIONS.LIST,
        element: <FormationsList />
      },
      {
        path: ROUTES.FORMATIONS.ADD,
        element: <FormationForm />
      },
      {
        path: ROUTES.FORMATIONS.EDIT,
        element: <FormationEdit />
      },
      {
        path: ROUTES.FORMATIONS.DETAILS,
        element: <FormationDetails />
      },
      {
        path: ROUTES.UI.GALLERY,
        element: <Gallery />
      },
      {
        path: ROUTES.UI.TABLES,
        element: <UserManagement />
      },
      {
        path: ROUTES.UI.ALERTS,
        element: <Alerts />
      },
      {
        path: ROUTES.UI.AVATARS,
        element: <Avatars />
      },
      {
        path: ROUTES.UI.BADGES,
        element: <Badges />
      },
      {
        path: ROUTES.UI.BUTTONS,
        element: <Buttons />
      },
      {
        path: ROUTES.UI.IMAGES,
        element: <Images />
      },
      {
        path: ROUTES.UI.VIDEOS,
        element: <Videos />
      },
      {
        path: ROUTES.USERS.STUDENT,
        element: <StudentDetails />
      },
      {
        path: ROUTES.USERS.INSTRUCTOR,
        element: <InstructorDetails />
      },
      {
        path: ROUTES.USERS.SUPERVISION,
        element: <InstructorSupervision />
      },
      {
        path: ROUTES.ENROLLMENTS,
        element: <EnrollmentsManagement />
      },
      {
        path: ROUTES.PAYMENTS,
        element: <PaymentManagement />
      },
      {
        path: ROUTES.CERTIFICATES.LIST,
        element: <Certificate />
      },
      {
        path: ROUTES.CERTIFICATES.QUIZ_LIST,
        element: <QuizList />
      },
      {
        path: '/admin/users',
        element: <UserManagement />,
      },
      {
        path: '/admin/users/add',
        element: <AddUser />,
      },
      {
        path: ROUTES.ARCHIVES,
        element: <Archives />
      },
      {
        path: '/formations/add-category',
        element: <AddCategory />
      },
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
];

export const router = createBrowserRouter(routes); 