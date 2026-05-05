import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Library } from "lucide-react";

export function FacilitiesSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Facilities</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage hostel, library, and infrastructure</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Library className="mr-2 h-5 w-5" />
            Facilities Management
          </CardTitle>
          <CardDescription>Coming soon - Manage college facilities and infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Facilities management features will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
