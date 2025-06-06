
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Upload, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [githubSaved, setGithubSaved] = useState(false);
  const [hfSaved, setHfSaved] = useState(false);
  const { toast } = useToast();

  // Load saved tokens on component mount
  useEffect(() => {
    const savedGithubToken = localStorage.getItem('github_token');
    const savedHfToken = localStorage.getItem('huggingface_token');
    
    if (savedGithubToken) {
      setGithubToken(savedGithubToken);
      setGithubSaved(true);
    }
    
    if (savedHfToken) {
      setHuggingfaceToken(savedHfToken);
      setHfSaved(true);
    }
  }, [setGithubToken, setHuggingfaceToken]);

  const saveGithubToken = () => {
    if (githubToken.trim()) {
      localStorage.setItem('github_token', githubToken);
      setGithubSaved(true);
      toast({
        title: "GitHub Token Saved",
        description: "Your GitHub token has been saved locally",
      });
    } else {
      toast({
        title: "Empty Token",
        description: "Please enter a token before saving",
        variant: "destructive",
      });
    }
  };

  const saveHuggingfaceToken = () => {
    if (huggingfaceToken.trim()) {
      localStorage.setItem('huggingface_token', huggingfaceToken);
      setHfSaved(true);
      toast({
        title: "Hugging Face Token Saved",
        description: "Your Hugging Face token has been saved locally",
      });
    } else {
      toast({
        title: "Empty Token",
        description: "Please enter a token before saving",
        variant: "destructive",
      });
    }
  };

  const clearGithubToken = () => {
    localStorage.removeItem('github_token');
    setGithubToken('');
    setGithubSaved(false);
    toast({
      title: "GitHub Token Cleared",
      description: "Your GitHub token has been removed",
    });
  };

  const clearHuggingfaceToken = () => {
    localStorage.removeItem('huggingface_token');
    setHuggingfaceToken('');
    setHfSaved(false);
    toast({
      title: "Hugging Face Token Cleared",
      description: "Your Hugging Face token has been removed",
    });
  };

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
            <div className="flex gap-2 mt-1">
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_..."
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  setGithubSaved(false);
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={saveGithubToken}
                disabled={githubSaved && githubToken.trim() !== ''}
                className="px-3"
              >
                {githubSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              </Button>
              {githubSaved && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearGithubToken}
                  className="px-3"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="hf-token" className="text-sm font-medium">
              Hugging Face Token
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="hf-token"
                type="password"
                placeholder="hf_..."
                value={huggingfaceToken}
                onChange={(e) => {
                  setHuggingfaceToken(e.target.value);
                  setHfSaved(false);
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={saveHuggingfaceToken}
                disabled={hfSaved && huggingfaceToken.trim() !== ''}
                className="px-3"
              >
                {hfSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              </Button>
              {hfSaved && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearHuggingfaceToken}
                  className="px-3"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Tokens are stored locally in your browser
          </div>
        </div>
      )}
    </div>
  );
};
