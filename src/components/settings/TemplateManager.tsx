import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../shared/Table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/Card";
import { Button } from "../shared/Button";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { type Template, templatesService } from "../../services/templatesService";

interface TemplateModalProps {
  template?: Template;
  onClose: () => void;
  onSave: (template: Omit<Template, "id" | "created_at" | "updated_at" | "created_by">) => Promise<void>;
}

function TemplateModal({ template, onClose, onSave }: TemplateModalProps) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [content, setContent] = useState(template?.content || "");
  const [category, setCategory] = useState(template?.category || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        name,
        description,
        content,
        category,
        is_active: true,
      });
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">
          {template ? "Edit Template" : "Create Template"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="e.g., Greeting, Follow-up, Technical Support"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1 rounded-md shadow-sm">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm font-mono"
                placeholder="Template content..."
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Use {"{variable}"} syntax for dynamic content (e.g., {"{customer_name}"})
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {template ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TemplateManager() {
  const { userRole } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateTemplate = async (
    template: Omit<Template, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    await templatesService.createTemplate(template);
    loadTemplates();
  };

  const handleUpdateTemplate = async (
    template: Omit<Template, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    if (!editingTemplate) return;
    await templatesService.updateTemplate(editingTemplate.id, template);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    await templatesService.deleteTemplate(id);
    loadTemplates();
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    await templatesService.toggleTemplateStatus(id, !isActive);
    loadTemplates();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Response Templates</CardTitle>
        {(userRole === "admin" || userRole === "employee") && (
          <Button onClick={() => setIsCreateModalOpen(true)}>Add Template</Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              {(userRole === "admin" || userRole === "employee") && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.category || "-"}</TableCell>
                <TableCell>{template.description || "-"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      template.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                {(userRole === "admin" || userRole === "employee") && (
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleToggleStatus(template.id, template.is_active)}
                      >
                        {template.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingTemplate(template)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={(userRole === "admin" || userRole === "employee") ? 5 : 4}
                  className="text-center py-8"
                >
                  No templates found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {(isCreateModalOpen || editingTemplate) && (
        <TemplateModal
          template={editingTemplate || undefined}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        />
      )}
    </Card>
  );
} 