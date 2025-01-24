import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { type TeamAssignmentRule } from "../../services/ticketRoutingService";

interface Props {
  teamId: string;
  rule?: TeamAssignmentRule;
  onClose: () => void;
  onSave: (rule: Partial<TeamAssignmentRule>) => Promise<void>;
}

export function AssignmentRuleModal({ teamId, rule, onClose, onSave }: Props) {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [priority, setPriority] = useState(rule?.priority || 0);
  const [conditions, setConditions] = useState<TeamAssignmentRule["conditions"]>(
    rule?.conditions || {}
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        name,
        description,
        priority,
        conditions,
        team_id: teamId,
      });
    } catch (error) {
      console.error("Error saving assignment rule:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCondition = (type: string) => {
    setConditions((prev) => ({
      ...prev,
      [type]: [],
    }));
  };

  const removeCondition = (type: string) => {
    setConditions((prev) => {
      const newConditions = { ...prev };
      delete newConditions[type];
      return newConditions;
    });
  };

  const updateConditionValues = (type: string, values: string[]) => {
    setConditions((prev) => ({
      ...prev,
      [type]: values,
    }));
  };

  return (
    <Modal
      title={rule ? "Edit Assignment Rule" : "Create Assignment Rule"}
      onClose={onClose}
    >
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
            Priority
          </label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            min={0}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Higher priority rules are evaluated first
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conditions
          </label>
          <div className="space-y-4">
            {Object.entries(conditions).map(([type, values]) => (
              <div key={type} className="flex items-start space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {type}
                  </label>
                  <input
                    type="text"
                    value={values.join(", ")}
                    onChange={(e) =>
                      updateConditionValues(
                        type,
                        e.target.value.split(",").map((v) => v.trim())
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Enter values separated by commas"
                  />
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeCondition(type)}
                >
                  Remove
                </Button>
              </div>
            ))}

            <div className="flex items-center space-x-2">
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    addCondition(e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Add condition...</option>
                {!conditions.category && <option value="category">Category</option>}
                {!conditions.priority && <option value="priority">Priority</option>}
                {!conditions.source && <option value="source">Source</option>}
                {!conditions.customer_type && (
                  <option value="customer_type">Customer Type</option>
                )}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const select = document.querySelector("select");
                  if (select && select.value) {
                    addCondition(select.value);
                    select.value = "";
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {rule ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 