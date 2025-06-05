
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Upload } from 'lucide-react';

interface AuthPanelProps {
  githubToken: string;
  setGithubToken: (token: string) => void;
  huggingfaceToken: string;
  setHuggingfaceToken: (token: string) => void;
}

export const AuthPanel = ({ 
  githubToken, 
  setGithubToken, 
  huggingfaceToken, 
  setHuggingfaceToken 
}: AuthPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4">
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
      >
        <span>Authentication</span>
        <Github className="h-4 w-4" />
      </Button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="github-token" className="text-sm font-medium">
              GitHub Token
            </Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_..."
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hf-token" className="text-sm font-medium">
              Hugging Face Token
            </Label>
            <Input
              id="hf-token"
              type="password"
              placeholder="hf_..."
              value={huggingfaceToken}
              onChange={(e) => setHuggingfaceToken(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="text-xs text-gray-500">
            Tokens are stored locally for this session only
          </div>
        </div>
      )}
    </div>
  );
};
