import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="flex justify-center">
            <Shield className="w-20 h-20 text-amber-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            System Maintenance
          </h2>
          <div className="mt-4 flex justify-center">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <p className="mt-4 text-xl text-gray-600">
            The system is currently under maintenance.
          </p>
          <p className="mt-2 text-gray-600">
            We apologize for the inconvenience. Our team is working to improve your experience.
            Only administrators can access the system during this maintenance period.
          </p>
        </div>
        <div className="mt-8">
          <Link to="/login">
            <Button className="w-full flex items-center justify-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Login
            </Button>
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            If you are an administrator, please log in with your credentials to access the system.
          </p>
        </div>
      </div>
    </div>
  );
} 