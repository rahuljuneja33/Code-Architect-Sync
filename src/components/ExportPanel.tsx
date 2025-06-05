
import { Button } from '@/components/ui/button';
import { FileNode } from '@/pages/Index';
import { Github, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  projectName: string;
  fileTree: FileNode[];
  githubToken: string;
  huggingfaceToken: string;
}

export const ExportPanel = ({ 
  projectName, 
  fileTree, 
  githubToken, 
  huggingfaceToken 
}: ExportPanelProps) => {
  const { toast } = useToast();

  const downloadAsZip = () => {
    // For now, this is a placeholder that shows the structure
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

  const pushToGithub = () => {
    if (!githubToken) {
      toast({
        title: "GitHub Token Required",
        description: "Please enter your GitHub token in the Authentication panel",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "GitHub Integration",
      description: "GitHub push functionality will be implemented in the backend",
    });
  };

  const deployToHuggingFace = () => {
    if (!huggingfaceToken) {
      toast({
        title: "Hugging Face Token Required",
        description: "Please enter your Hugging Face token in the Authentication panel",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Hugging Face Integration",
      description: "Hugging Face deployment will be implemented in the backend",
    });
  };

  const openInVSCode = () => {
    toast({
      title: "VS Code Integration",
      description: "This feature requires VS Code to be installed locally",
    });
  };

  return (
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
        <Button
          onClick={pushToGithub}
          className="bg-gray-900 hover:bg-gray-800"
        >
          <Github className="h-4 w-4 mr-2" />
          Push to GitHub
        </Button>
        
        <Button
          onClick={deployToHuggingFace}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Upload className="h-4 w-4 mr-2" />
          Deploy to HF
        </Button>
      </div>
    </div>
  );
};
