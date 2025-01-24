import { useState } from 'react';
import { teamService } from '../../services/teamService';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

interface CreateTeamModalProps {
  onClose: () => void;
  onTeamCreated: () => void;
}

export function CreateTeamModal({ onClose, onTeamCreated }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await teamService.createTeam({
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: true,
      });
      onTeamCreated();
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Create Team" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-gray-700"
          >
            Team Name
          </label>
          <input
            type="text"
            id="team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter team name"
          />
        </div>

        <div>
          <label
            htmlFor="team-description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="team-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter team description (optional)"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 