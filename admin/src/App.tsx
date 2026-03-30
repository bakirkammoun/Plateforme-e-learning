import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { router } from './routes/index';
import { SidebarProvider } from './context/SidebarContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default App;
