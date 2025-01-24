import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/shared/Tabs";
import { CategoryManager } from "../components/settings/CategoryManager";
import { TagManager } from "../components/settings/TagManager";
import { CustomFieldManager } from "../components/settings/CustomFieldManager";
import { TemplateManager } from "../components/settings/TemplateManager";
import { useAuth } from "../context/AuthContext";

export function Settings() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");

  if (!userRole || userRole === "customer") {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">You don't have permission to access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="tags">
          <TagManager />
        </TabsContent>

        <TabsContent value="custom-fields">
          <CustomFieldManager />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
} 