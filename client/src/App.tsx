import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import MainAdminPanel from "@/pages/main-admin";
import AdminLogin from "@/pages/admin-login";
import DepartmentPanel from "@/pages/department-panel";
import MiniPanel from "@/pages/mini-panel";
import UpdatesBoard from "@/pages/updates-board";
import NoticeBoard from "@/pages/notice-board";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assistant" component={Home} />
      <Route path="/assistant/:instId" component={Home} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/:instId" component={MainAdminPanel} />
      <Route path="/admin" component={MainAdminPanel} />
      <Route path="/head-admin" component={MainAdminPanel} />
      <Route path="/mini-panel" component={MiniPanel} />
      <Route path="/updates" component={UpdatesBoard} />
      <Route path="/department/:slug" component={DepartmentPanel} />
      <Route path="/notice-board" component={NoticeBoard} />
      <Route>
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
