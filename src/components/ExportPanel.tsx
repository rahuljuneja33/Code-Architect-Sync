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

// UTF-8 safe Base64 encoding function
const utf8ToBase64 = (str: string): string => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
};

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

  const convertFileTreeToGitHubFiles = (files: FileNode[], basePath = ''): Record<string, { content: string }> => {
    const result: Record<string, { content: string }> = {};
    
    files.forEach(file => {
      const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
      
      if (file.type === 'file') {
        result[fullPath] = {
          content: file.content || `// ${file.name}\n// Auto-generated file`
        };
      } else if (file.type === 'folder' && file.children) {
        // Add folder structure by creating files within it
        const childFiles = convertFileTreeToGitHubFiles(file.children, fullPath);
        Object.assign(result, childFiles);
        
        // If folder is empty, create a .gitkeep file
        if (file.children.length === 0) {
          result[`${fullPath}/.gitkeep`] = { content: '' };
        }
      }
    });
    
    return result;
  };

  // Recursively gather all files with their paths for HF upload
  const getFilesForHFUpload = (nodes: FileNode[], basePath = ''): { path: string; content: string }[] => {
    let files: { path: string; content: string }[] = [];
    nodes.forEach(node => {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
      if (node.type === 'file') {
        files.push({ path: fullPath, content: node.content || `// ${node.name}\n// Auto-generated file` });
      } else if (node.type === 'folder') {
        if (node.children && node.children.length > 0) {
          files = files.concat(getFilesForHFUpload(node.children, fullPath));
        } else {
          // Empty folder: create a .gitkeep file
          files.push({ path: `${fullPath}/.gitkeep`, content: '' });
        }
      }
    });
    return files;
  };

  // Helper to ensure app.py is always present for HF Spaces (gradio/streamlit)
  function ensureAppPy(hfFiles: { path: string; content: string }[], sdk: string): { path: string; content: string }[] {
    if (sdk !== "gradio" && sdk !== "streamlit") return hfFiles;
    // check for app.py or app.<ext>
    if (!hfFiles.some(f => f.path === "app.py" || f.path.startsWith("app."))) {
      return [...hfFiles, { path: "app.py", content: "# This file is required for running your Space\n" }];
    }
    return hfFiles;
  }

  // Add sleep for retries (ms)
  function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

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
      // Create GitHub repository
      const repoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name: githubForm.repoName,
          description: githubForm.description,
          private: githubForm.isPrivate,
          auto_init: true
        })
      });

      if (!repoResponse.ok) {
        const errorData = await repoResponse.json();
        throw new Error(errorData.message || 'Failed to create repository');
      }

      const repoData = await repoResponse.json();
      console.log('Repository created:', repoData);

      // Convert file tree to GitHub format
      const files = convertFileTreeToGitHubFiles(fileTree);
      
      // Upload files to the repository
      for (const [filePath, fileData] of Object.entries(files)) {
        try {
          await fetch(`https://api.github.com/repos/${repoData.full_name}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
              message: `Add ${filePath}`,
              content: btoa(fileData.content), // Base64 encode content
              branch: 'main'
            })
          });
        } catch (fileError) {
          console.warn(`Failed to upload ${filePath}:`, fileError);
        }
      }
      
      toast({
        title: "Repository Created Successfully",
        description: `Repository "${githubForm.repoName}" has been created and files uploaded to GitHub`,
      });
      
      setIsGitHubDialogOpen(false);
    } catch (error) {
      console.error('GitHub creation error:', error);
      toast({
        title: "GitHub Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create repository. Please check your token and try again.",
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
      // Get user info first
      const userResponse = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: {
          'Authorization': `Bearer ${huggingfaceToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Invalid Hugging Face token');
      }

      const userData = await userResponse.json();
      const username = userData.name;

      // Create Hugging Face Space
      const spaceResponse = await fetch(`https://huggingface.co/api/repos/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingfaceToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'space',
          name: hfForm.spaceName,
          private: false,
          sdk: hfForm.sdk,
          license: hfForm.license
        })
      });

      if (!spaceResponse.ok) {
        const errorData = await spaceResponse.json();
        throw new Error(errorData.error || 'Failed to create space');
      }

      // Build README
      const readmeContent = `---
title: ${hfForm.spaceName}
emoji: 🚀
colorFrom: blue
colorTo: red
sdk: ${hfForm.sdk}
sdk_version: "4.44.0"
app_file: app.py
pinned: false
license: ${hfForm.license}
---

# ${hfForm.spaceName}

${hfForm.description}

This space was created using File Structure Builder.

## Project Structure

\`\`\`
${JSON.stringify(fileTree, null, 2)}
\`\`\`
`;

      // Gather all files for upload, including README.md
      let hfFiles = [
        { path: 'README.md', content: readmeContent },
        ...getFilesForHFUpload(fileTree)
      ];
      hfFiles = ensureAppPy(hfFiles, hfForm.sdk);

      // Helper to upload a single file with increased retry window and better logging if 404
      const uploadWithRetry = async (file, tries = 10) => {
        const fileUrl = `https://huggingface.co/api/spaces/${username}/${hfForm.spaceName}/upload/main/${encodeURIComponent(file.path)}`;
        let lastErr;
        let delay = 2000;
        for (let t = 0; t < tries; t++) {
          const res = await fetch(
            fileUrl,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${huggingfaceToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: utf8ToBase64(file.content),
                commit_title: `Add ${file.path}`,
                commit_message: `Initial commit: add ${file.path}`,
              }),
            }
          );
          if (res.ok) return;
          lastErr = res;
          // More visible console on failure
          console.warn(`Attempt ${t+1}/${tries}: Failed to upload ${file.path} - status ${res.status}`);
          // retry for 404s, wait (exponential backoff capped at 5s)
          if (res.status === 404 && t < tries - 1) {
            await sleep(delay);
            delay = Math.min(delay * 1.25, 5000);
          } else {
            break;
          }
        }
        let errObj = {};
        try { errObj = await lastErr.json(); } catch {}
        throw new Error(
          (errObj as any)?.error ||
          `Failed to upload: ${file.path}. Status ${lastErr.status}. ` +
          `If this is your FIRST upload to a new Space, it can take up to a minute for provisioning. ` +
          `If this keeps failing, wait and try again.`
        );
      };

      // Upload each file using the correct endpoint for Spaces
      for (const file of hfFiles) {
        await uploadWithRetry(file);
      }

      toast({
        title: "Space Created & Files Synced!",
        description: `All files/folders have been uploaded to Hugging Face Space "${hfForm.spaceName}".`,
      });
      
      setIsHFDialogOpen(false);
    } catch (error) {
      console.error('Hugging Face creation error:', error);
      toast({
        title: "Space Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create Hugging Face Space. Please check your token and try again.",
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
    
    try {
      // Try to open VS Code with a custom protocol
      const vscodeUrl = `vscode://file/${encodeURIComponent(projectName)}`;
      window.open(vscodeUrl, '_blank');
      
      toast({
        title: "Opening in VS Code",
        description: "If VS Code doesn't open, make sure it's installed and the protocol handler is enabled",
      });
    } catch (error) {
      // Fallback: create a temporary file structure and download it
      const createFileStructure = (nodes: FileNode[], basePath = ''): string => {
        let structure = '';
        nodes.forEach(node => {
          const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
          if (node.type === 'file') {
            structure += `File: ${fullPath}\n`;
            structure += `Content:\n${node.content || '// Empty file'}\n\n---\n\n`;
          } else if (node.type === 'folder' && node.children) {
            structure += `Folder: ${fullPath}/\n`;
            structure += createFileStructure(node.children, fullPath);
          }
        });
        return structure;
      };

      const projectStructure = `Project: ${projectName}\n\n${createFileStructure(fileTree)}`;
      const blob = new Blob([projectStructure], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-for-vscode.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "VS Code Protocol Failed",
        description: "Downloaded project structure as text file. You can manually create the files in VS Code.",
        variant: "destructive",
      });
    }
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
