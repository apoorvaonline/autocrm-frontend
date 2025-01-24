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
import { type CustomField, customFieldsService } from "../../services/customFieldsService";

interface CustomFieldModalProps {
  field?: CustomField;
  onClose: () => void;
  onSave: (field: Omit<CustomField, "id" | "created_at">) => Promise<void>;
}

function CustomFieldModal({ field, onClose, onSave }: CustomFieldModalProps) {
  const [name, setName] = useState(field?.name || "");
  const [description, setDescription] = useState(field?.description || "");
  const [fieldType, setFieldType] = useState<CustomField["field_type"]>(field?.field_type || "text");
  const [options, setOptions] = useState<string[]>(field?.options || []);
  const [isRequired, setIsRequired] = useState(field?.is_required || false);
  const [entityType, setEntityType] = useState<CustomField["entity_type"]>(field?.entity_type || "ticket");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        name,
        description,
        field_type: fieldType,
        options: fieldType === "select" ? options : undefined,
        is_required: isRequired,
        is_active: true,
        entity_type: entityType,
      });
      onClose();
    } catch (error) {
      console.error("Error saving custom field:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {field ? "Edit Custom Field" : "Create Custom Field"}
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
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Field Type
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomField["field_type"])}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>

          {fieldType === "select" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Options (one per line)
              </label>
              <textarea
                value={options.join("\n")}
                onChange={(e) => setOptions(e.target.value.split("\n").filter(Boolean))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                rows={3}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as CustomField["entity_type"])}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="ticket">Ticket</option>
              <option value="customer">Customer</option>
              <option value="team">Team</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
              Required Field
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="tertiary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
            >
              {field ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomFieldManager() {
  const { userRole } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await customFieldsService.getCustomFields();
      setFields(data);
    } catch (error) {
      console.error("Error loading custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleCreateField = async (
    field: Omit<CustomField, "id" | "created_at">
  ) => {
    await customFieldsService.createCustomField(field);
    loadFields();
  };

  const handleUpdateField = async (
    field: Omit<CustomField, "id" | "created_at">
  ) => {
    if (!editingField) return;
    await customFieldsService.updateCustomField(editingField.id, field);
    loadFields();
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom field?")) return;
    await customFieldsService.deleteCustomField(id);
    loadFields();
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    await customFieldsService.toggleCustomFieldStatus(id, !isActive);
    loadFields();
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
        <CardTitle>Custom Fields</CardTitle>
        {userRole === "admin" && (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Field
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Status</TableHead>
              {userRole === "admin" && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.name}</TableCell>
                <TableCell>{field.field_type}</TableCell>
                <TableCell>{field.entity_type}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      field.is_required
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {field.is_required ? "Required" : "Optional"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      field.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {field.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                {userRole === "admin" && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="tertiary"
                        onClick={() => setEditingField(field)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="tertiary"
                        onClick={() => handleToggleStatus(field.id, field.is_active)}
                      >
                        {field.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={userRole === "admin" ? 6 : 5}
                  className="text-center py-8"
                >
                  No custom fields found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {(isCreateModalOpen || editingField) && (
        <CustomFieldModal
          field={editingField || undefined}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingField(null);
          }}
          onSave={editingField ? handleUpdateField : handleCreateField}
        />
      )}
    </Card>
  );
} 