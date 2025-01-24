import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

interface EmployeeSelectProps {
  onSelect: (employee: Employee) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  excludeUserIds?: string[];
}

export function EmployeeSelect({
  onSelect,
  onBlur,
  placeholder = 'Search for an employee...',
  className = '',
  excludeUserIds = [],
}: EmployeeSelectProps) {
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  useEffect(() => {
    const searchEmployees = async () => {
      if (!query.trim()) {
        setEmployees([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        let query_builder = supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'employee')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .order('full_name')
          .limit(10);

        if (excludeUserIds.length > 0) {
          query_builder = query_builder.not('id', 'in', `(${excludeUserIds.join(',')})`);
        }

        const { data, error: searchError } = await query_builder;

        if (searchError) throw searchError;
        setEmployees(data || []);
      } catch (err) {
        console.error('Error searching employees:', err);
        setError('Failed to search employees');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchEmployees, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query, excludeUserIds]);

  const handleSelect = (employee: Employee) => {
    onSelect(employee);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder={placeholder}
      />

      {isOpen && (query.trim() || employees.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {loading && (
              <li className="text-gray-500 select-none relative py-2 pl-3 pr-9">
                Searching...
              </li>
            )}

            {error && (
              <li className="text-red-500 select-none relative py-2 pl-3 pr-9">
                {error}
              </li>
            )}

            {!loading &&
              !error &&
              employees.map((employee) => (
                <li
                  key={employee.id}
                  className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                  onClick={() => handleSelect(employee)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{employee.full_name}</span>
                    <span className="text-sm text-gray-500">{employee.email}</span>
                  </div>
                </li>
              ))}

            {!loading && !error && employees.length === 0 && query.trim() && (
              <li className="text-gray-500 select-none relative py-2 pl-3 pr-9">
                No employees found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 