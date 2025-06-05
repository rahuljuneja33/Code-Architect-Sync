
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Code } from 'lucide-react';

interface ProjectHeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
}

export const ProjectHeader = ({ projectName, setProjectName }: ProjectHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const handleSave = () => {
    setProjectName(tempName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempName(projectName);
      setIsEditing(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <Code className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyPress}
              className="text-xl font-bold"
              autoFocus
            />
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">{projectName}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-1 h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        File Structure Builder
      </div>
    </header>
  );
};
