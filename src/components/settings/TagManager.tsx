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
import { type Tag, tagsService } from "../../services/tagsService";
import { useAuth } from "../../context/AuthContext";

interface TagModalProps {
  tag?: Tag;
  onClose: () => void;
  onSave: (tag: Omit<Tag, "id" | "created_at">) => Promise<void>;
}

function TagModal({ tag, onClose, onSave }: TagModalProps) {
  const [name, setName] = useState(tag?.name || "");
  const [description, setDescription] = useState(tag?.description || "");
  const [color, setColor] = useState(tag?.color || "#6B7280");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        name,
        description,
        color,
      });
      onClose();
    } catch (error) {
      console.error("Error saving tag:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {tag ? "Edit Tag" : "Create Tag"}
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
              Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 rounded-md border-gray-300"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
                placeholder="#000000"
              />
            </div>
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
              {tag ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TagManager() {
  const { userRole } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [popularTags, setPopularTags] = useState<{ tag: Tag; count: number }[]>([]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const [tagsData, popularTagsData] = await Promise.all([
        tagsService.getTags(),
        tagsService.getPopularTags(5),
      ]);
      setTags(tagsData);
      setPopularTags(popularTagsData);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreateTag = async (tag: Omit<Tag, "id" | "created_at">) => {
    await tagsService.createTag(tag);
    loadTags();
  };

  const handleUpdateTag = async (tag: Omit<Tag, "id" | "created_at">) => {
    if (!editingTag) return;
    await tagsService.updateTag(editingTag.id, tag);
    loadTags();
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    await tagsService.deleteTag(id);
    loadTags();
  };

  const canManageTags = userRole === "admin" || userRole === "employee";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Popular Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(({ tag, count }) => (
              <div
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color,
                }}
              >
                {tag.name}
                <span className="ml-2 text-xs opacity-75">({count})</span>
              </div>
            ))}
            {popularTags.length === 0 && (
              <p className="text-gray-500">No tags used yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tags</CardTitle>
          {userRole === "admin" && (
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add Tag
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Description</TableHead>
                {canManageTags && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tag.description}</TableCell>
                  {canManageTags && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="tertiary"
                          onClick={() => setEditingTag(tag)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {tags.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManageTags ? 3 : 2}
                    className="text-center py-8"
                  >
                    No tags found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(isCreateModalOpen || editingTag) && (
        <TagModal
          tag={editingTag || undefined}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTag(null);
          }}
          onSave={editingTag ? handleUpdateTag : handleCreateTag}
        />
      )}
    </div>
  );
} 