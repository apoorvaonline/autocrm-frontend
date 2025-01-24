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
import {
  type TicketCategory,
  ticketCategoriesService,
} from "../../services/ticketCategoriesService";
import { useAuth } from "../../context/AuthContext";

interface CategoryModalProps {
  category?: TicketCategory;
  parentCategories: TicketCategory[];
  onClose: () => void;
  onSave: (category: Omit<TicketCategory, "id" | "created_at" | "updated_at">) => Promise<void>;
}

function CategoryModal({ category, parentCategories, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState(category?.parent_id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        name,
        description,
        parent_id: parentId || undefined,
        is_active: true,
      });
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {category ? "Edit Category" : "Create Category"}
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
              Parent Category
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">None</option>
              {parentCategories
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
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
              {category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoryManager() {
  const { userRole } = useAuth();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await ticketCategoriesService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (
    category: Omit<TicketCategory, "id" | "created_at" | "updated_at">
  ) => {
    await ticketCategoriesService.createCategory(category);
    loadCategories();
  };

  const handleUpdateCategory = async (
    category: Omit<TicketCategory, "id" | "created_at" | "updated_at">
  ) => {
    if (!editingCategory) return;
    await ticketCategoriesService.updateCategory(editingCategory.id, category);
    loadCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await ticketCategoriesService.deleteCategory(id);
    loadCategories();
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    await ticketCategoriesService.toggleCategoryStatus(id, !isActive);
    loadCategories();
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
        <CardTitle>Ticket Categories</CardTitle>
        {userRole === "admin" && (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Category
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead>Status</TableHead>
              {userRole === "admin" && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>{category.parent?.name || "-"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      category.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                {userRole === "admin" && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="tertiary"
                        onClick={() => setEditingCategory(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="tertiary"
                        onClick={() => handleToggleStatus(category.id, category.is_active)}
                      >
                        {category.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={userRole === "admin" ? 5 : 4}
                  className="text-center py-8"
                >
                  No categories found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {(isCreateModalOpen || editingCategory) && (
        <CategoryModal
          category={editingCategory || undefined}
          parentCategories={categories}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        />
      )}
    </Card>
  );
} 