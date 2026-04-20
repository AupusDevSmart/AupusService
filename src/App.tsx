import { RouterProvider } from 'react-router-dom';
// import { Analytics } from "@vercel/analytics/react"
// import { SpeedInsights } from "@vercel/speed-insights/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

import { appRoutes } from './AppRoutes';
import { FIFTEEN_MINUTES, FIVE_MINUTES } from './config/constants';
import { ThemeProvider } from './components/theme-provider';
import { ServiceSharedPagesProvider } from './shared-pages-adapter';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      gcTime: FIVE_MINUTES,
      staleTime: FIFTEEN_MINUTES,
    },
  },
});
export default function App() {
  // React.useEffect(() => {
  //   configureAxios();
  // }, []);

  return (
    <>
      {/* <SpeedInsights />
      <Analytics /> */}
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {/* {isDev && (
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
          )} */}
          <ServiceSharedPagesProvider>
            <TooltipProvider>
              <RouterProvider router={appRoutes} />
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </TooltipProvider>
          </ServiceSharedPagesProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}