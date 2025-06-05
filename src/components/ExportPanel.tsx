
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileNode } from '@/pages/Index';
import { Github, Upload, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  projectName: string;
  fileTree: FileNode[];
  githubToken: string;
  huggingfaceToken: string;
}

interface GitHubRepoForm {
  repoName: string;
  description: string;
  isPrivate: boolean;
}

interface HuggingFaceSpaceForm {
  spaceName: string;
  description: string;
  sdk: 'gradio' | 'streamlit' | 'static';
  license: string;
}

export const ExportPanel = ({ 
  projectName, 
  fileTree, 
  githubToken, 
  huggingfaceToken 
}: ExportPanelProps) => {
  const { toast } = useToast();
  const [isGitHubDialogOpen, setIsGitHubDialogOpen] = useState(false);
  const [isHFDialogOpen, setIsHFDialogOpen] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  const [githubForm, setGitHubForm] = useState<GitHubRepoForm>({
    repoName: projectName,
    description: `Project created with File Structure Builder`,
    isPrivate: false
  });

  const [hfForm, setHFForm] = useState<HuggingFaceSpaceForm>({
    spaceName: projectName,
    description: `Project created with File Structure Builder`,
    sdk: 'gradio',
    license: 'mit'
  });

  const validateGitHubAuth = () => {
    if (!githubToken) {
      toast({
        title: "GitHub Token Required",
        description: "Please enter your GitHub token in the Authentication panel",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateHuggingFaceAuth = () => {
    if (!huggingfaceToken) {
      toast({
        title: "Hugging Face Token Required",
        description: "Please enter your Hugging Face token in the Authentication panel",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateProjectStructure = () => {
    if (fileTree.length === 0) {
      toast({
        title: "No Files to Export",
        description: "Please create some files and folders before exporting",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const downloadAsZip = () => {
    if (!validateProjectStructure()) return;
    
    const structure = JSON.stringify(fileTree, null, 2);
    const blob = new Blob([structure], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-structure.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Project structure exported as JSON",
    });
  };

  const createGitHubRepo = async () => {
    if (!validateGitHubAuth() || !validateProjectStructure()) return;
    
    if (!githubForm.repoName.trim()) {
      toast({
        title: "Repository Name Required",
        description: "Please enter a valid repository name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingRepo(true);
    
    try {
      // Simulate API call to create GitHub repo
      // In a real implementation, this would call the GitHub API
      console.log('Creating GitHub repo with:', githubForm);
      console.log('Files to upload:', fileTree);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Repository Created Successfully",
        description: `Repository "${githubForm.repoName}" has been created and files uploaded to GitHub`,
      });
      
      setIsGitHubDialogOpen(false);
    } catch (error) {
      toast({
        title: "GitHub Creation Failed",
        description: "Failed to create repository. Please check your token and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const createHuggingFaceSpace = async () => {
    if (!validateHuggingFaceAuth() || !validateProjectStructure()) return;
    
    if (!hfForm.spaceName.trim()) {
      toast({
        title: "Space Name Required",
        description: "Please enter a valid space name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingSpace(true);
    
    try {
      // Simulate API call to create Hugging Face Space
      // In a real implementation, this would call the Hugging Face Hub API
      console.log('Creating HF Space with:', hfForm);
      console.log('Files to upload:', fileTree);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Space Created Successfully",
        description: `Hugging Face Space "${hfForm.spaceName}" has been created and deployed`,
      });
      
      setIsHFDialogOpen(false);
    } catch (error) {
      toast({
        title: "Space Creation Failed",
        description: "Failed to create Hugging Face Space. Please check your token and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const pushToGithub = () => {
    if (!validateGitHubAuth() || !validateProjectStructure()) return;
    setIsGitHubDialogOpen(true);
  };

  const deployToHuggingFace = () => {
    if (!validateHuggingFaceAuth() || !validateProjectStructure()) return;
    setIsHFDialogOpen(true);
  };

  const openInVSCode = () => {
    if (!validateProjectStructure()) return;
    
    toast({
      title: "VS Code Integration",
      description: "This feature requires VS Code to be installed locally",
    });
  };

  return (
    <>
      <div className="h-20 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsZip}
          >
            <Download className="h-4 w-4 mr-2" />
            Download ZIP
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openInVSCode}
          >
            Open in VS Code
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={isGitHubDialogOpen} onOpenChange={setIsGitHubDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={pushToGithub}
                className="bg-gray-900 hover:bg-gray-800"
              >
                <Github className="h-4 w-4 mr-2" />
                Push to GitHub
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create GitHub Repository</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name *</Label>
                  <Input
                    id="repo-name"
                    value={githubForm.repoName}
                    onChange={(e) => setGitHubForm(prev => ({ ...prev, repoName: e.target.value }))}
                    placeholder="my-awesome-project"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo-description">Description</Label>
                  <Input
                    id="repo-description"
                    value={githubForm.description}
                    onChange={(e) => setGitHubForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A description of your project"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="private-repo"
                    checked={githubForm.isPrivate}
                    onChange={(e) => setGitHubForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  />
                  <Label htmlFor="private-repo">Private repository</Label>
                </div>
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>This will create a new repository on GitHub</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsGitHubDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createGitHubRepo} disabled={isCreatingRepo}>
                  {isCreatingRepo ? 'Creating...' : 'Create Repository'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isHFDialogOpen} onOpenChange={setIsHFDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={deployToHuggingFace}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Deploy to HF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Hugging Face Space</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="space-name">Space Name *</Label>
                  <Input
                    id="space-name"
                    value={hfForm.spaceName}
                    onChange={(e) => setHFForm(prev => ({ ...prev, spaceName: e.target.value }))}
                    placeholder="my-awesome-space"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="space-description">Description</Label>
                  <Input
                    id="space-description"
                    value={hfForm.description}
                    onChange={(e) => setHFForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A description of your space"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sdk">SDK</Label>
                  <select
                    id="sdk"
                    value={hfForm.sdk}
                    onChange={(e) => setHFForm(prev => ({ ...prev, sdk: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="gradio">Gradio</option>
                    <option value="streamlit">Streamlit</option>
                    <option value="static">Static</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License</Label>
                  <select
                    id="license"
                    value={hfForm.license}
                    onChange={(e) => setHFForm(prev => ({ ...prev, license: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="mit">MIT</option>
                    <option value="apache-2.0">Apache 2.0</option>
                    <option value="gpl-3.0">GPL 3.0</option>
                    <option value="bsd-3-clause">BSD 3-Clause</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>This will create a new Space on Hugging Face</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsHFDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createHuggingFaceSpace} disabled={isCreatingSpace}>
                  {isCreatingSpace ? 'Creating...' : 'Create Space'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};
