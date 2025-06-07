import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileNode } from '@/pages/Index';
import { Github, Upload, Download, AlertCircle, Code } from 'lucide-react';
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

  const downloadAsJson = () => {
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

  const createProjectZip = () => {
    if (!validateProjectStructure()) return;
    
    // Create a ZIP-like structure for VS Code integration
    const createFilesForVSCode = (nodes: FileNode[], basePath = ''): { [key: string]: string } => {
      const files: { [key: string]: string } = {};
      
      nodes.forEach(node => {
        const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
        
        if (node.type === 'file') {
          files[fullPath] = node.content || `// ${node.name}\n// Auto-generated file`;
        } else if (node.type === 'folder' && node.children) {
          // Create files within the folder
          const childFiles = createFilesForVSCode(node.children, fullPath);
          Object.assign(files, childFiles);
          
          // If folder is empty, create a .gitkeep file
          if (node.children.length === 0) {
            files[`${fullPath}/.gitkeep`] = '';
          }
        }
      });
      
      return files;
    };

    try {
      const files = createFilesForVSCode(fileTree);
      
      // Try to use the File System Access API to create files directly
      if ('showDirectoryPicker' in window) {
        createProjectWithFileSystemAPI(files);
      } else {
        // Fallback: Create a comprehensive project structure file
        createProjectStructureFile(files);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      // Fallback to the old method
      createProjectStructureFile(createFilesForVSCode(fileTree));
    }
  };

  const createProjectWithFileSystemAPI = async (files: { [key: string]: string }) => {
    try {
      // Request directory access
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });

      // Create project directory
      const projectDirHandle = await directoryHandle.getDirectoryHandle(projectName, {
        create: true
      });

      // Create all files and folders
      for (const [filePath, content] of Object.entries(files)) {
        const pathParts = filePath.split('/');
        let currentDir = projectDirHandle;

        // Create nested directories
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentDir = await currentDir.getDirectoryHandle(pathParts[i], {
            create: true
          });
        }

        // Create the file
        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName, {
          create: true
        });

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      }

      toast({
        title: "Project Created Successfully",
        description: `Project "${projectName}" has been created locally. Opening in VS Code...`,
      });

      // Try to open in VS Code
      setTimeout(() => {
        openInVSCode();
      }, 1000);

    } catch (error) {
      console.error('File System API failed:', error);
      toast({
        title: "Direct File Creation Failed",
        description: "Falling back to downloadable project structure",
        variant: "destructive",
      });
      createProjectStructureFile(files);
    }
  };

  const createProjectStructureFile = (files: { [key: string]: string }) => {
    const createFileStructure = (): string => {
      let structure = '';
      Object.entries(files).forEach(([filePath, content]) => {
        structure += `=== FILE: ${filePath} ===\n`;
        structure += `${content}\n\n`;
      });
      return structure;
    };

    const projectStructure = `PROJECT: ${projectName}
Generated by File Structure Builder

INSTRUCTIONS:
1. Create a new folder named "${projectName}"
2. Create the files and folders as described below
3. Copy the content for each file
4. Open the folder in VS Code using: code ${projectName}

PROJECT STRUCTURE:
${createFileStructure()}

=== END OF PROJECT ===

VS CODE COMMANDS:
1. mkdir ${projectName}
2. cd ${projectName}
${Object.keys(files).map(filePath => {
  const dirs = filePath.split('/').slice(0, -1);
  return dirs.length > 0 ? `3. mkdir -p ${dirs.join('/')}` : '';
}).filter(Boolean).join('\n')}
${Object.entries(files).map(([filePath, content], index) => 
  `${index + 4}. echo '${content.replace(/'/g, "\\'")}' > ${filePath}`
).join('\n')}
${Object.keys(files).length + 4}. code .`;

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
      title: "Project Structure Downloaded",
      description: "Follow the instructions in the downloaded file to create your project in VS Code",
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

      console.log('Hugging Face Space created');

      // Create a simple README for the space
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

      // Upload README to the space using the fixed UTF-8 to Base64 encoding
      await fetch(`https://huggingface.co/api/repos/${username}/${hfForm.spaceName}/upload/main`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingfaceToken}`,
        },
        body: JSON.stringify({
          files: [
            {
              path: 'README.md',
              content: utf8ToBase64(readmeContent)
            }
          ],
          commit_message: 'Initial commit with project structure'
        })
      });
      
      toast({
        title: "Space Created Successfully",
        description: `Hugging Face Space "${hfForm.spaceName}" has been created and deployed`,
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

  const openInVSCode = () => {
    if (!validateProjectStructure()) return;
    
    try {
      // Try multiple VS Code integration methods
      const methods = [
        // Method 1: VS Code protocol handler
        () => {
          const vscodeUrl = `vscode://file/${encodeURIComponent(projectName)}`;
          window.open(vscodeUrl, '_blank');
        },
        // Method 2: VS Code insiders protocol
        () => {
          const vscodeUrl = `vscode-insiders://file/${encodeURIComponent(projectName)}`;
          window.open(vscodeUrl, '_blank');
        },
        // Method 3: Try to execute VS Code command (if available)
        () => {
          if ('navigator' in window && 'clipboard' in navigator) {
            navigator.clipboard.writeText(`code ${projectName}`);
            toast({
              title: "Command Copied",
              description: `"code ${projectName}" copied to clipboard. Run this in your terminal after creating the project.`,
            });
          }
        }
      ];

      // Try the first method
      methods[0]();
      
      toast({
        title: "Opening in VS Code",
        description: "If VS Code doesn't open automatically, use the 'Create for VS Code' button to download the project structure",
      });
      
    } catch (error) {
      console.error('VS Code integration failed:', error);
      toast({
        title: "VS Code Integration Failed",
        description: "Please use the 'Create for VS Code' button to download the project structure manually",
        variant: "destructive",
      });
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

  return (
    <>
      <div className="h-20 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsJson}
          >
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={createProjectZip}
          >
            <Code className="h-4 w-4 mr-2" />
            Create for VS Code
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
