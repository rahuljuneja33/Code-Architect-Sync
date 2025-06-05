import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileNode } from '@/pages/Index';
import { Folder, FolderOpen, File, Plus, Trash, FileText } from 'lucide-react';
import { StructureImporter } from './StructureImporter';

interface FileExplorerProps {
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  selectedFile: FileNode | null;
  setSelectedFile: (file: FileNode | null) => void;
}

export const FileExplorer = ({ 
  fileTree, 
  setFileTree, 
  selectedFile, 
  setSelectedFile 
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [showNewItemInput, setShowNewItemInput] = useState(false);
  const [showStructureImporter, setShowStructureImporter] = useState(false);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const generateId = () => Date.now().toString();

  const addNewItem = () => {
    if (!newItemName.trim()) return;

    const newItem: FileNode = {
      id: generateId(),
      name: newItemName,
      type: newItemType,
      content: newItemType === 'file' ? '' : undefined,
      children: newItemType === 'folder' ? [] : undefined
    };

    setFileTree([...fileTree, newItem]);
    setNewItemName('');
    setShowNewItemInput(false);
  };

  const deleteItem = (itemId: string) => {
    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(node => node.id !== itemId).map(node => ({
        ...node,
        children: node.children ? filterNodes(node.children) : undefined
      }));
    };
    setFileTree(filterNodes(fileTree));
    if (selectedFile?.id === itemId) {
      setSelectedFile(null);
    }
  };

  const handleStructureImport = (importedStructure: FileNode[]) => {
    setFileTree([...fileTree, ...importedStructure]);
  };

  const renderFileNode = (node: FileNode, depth = 0) => {
    const isSelected = selectedFile?.id === node.id;
    const isExpanded = expandedFolders.has(node.id);

    return (
      <div key={node.id}>
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer group ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              setSelectedFile(node);
            }
          }}
        >
          {node.type === 'folder' ? (
            isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500 mr-2" /> 
                      : <Folder className="h-4 w-4 text-blue-500 mr-2" />
          ) : (
            <File className="h-4 w-4 text-gray-500 mr-2" />
          )}
          
          <span className="flex-1 text-sm truncate">{node.name}</span>
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(node.id);
            }}
          >
            <Trash className="h-3 w-3" />
          </Button>
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Files</h2>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStructureImporter(!showStructureImporter)}
              title="Import Structure"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewItemInput(!showNewItemInput)}
              title="Add File/Folder"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showNewItemInput && (
          <div className="space-y-2 mb-3">
            <div className="flex space-x-2">
              <Button
                variant={newItemType === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItemType('file')}
              >
                File
              </Button>
              <Button
                variant={newItemType === 'folder' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItemType('folder')}
              >
                Folder
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder={`${newItemType} name`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addNewItem();
                  if (e.key === 'Escape') setShowNewItemInput(false);
                }}
                className="text-sm"
              />
              <Button size="sm" onClick={addNewItem}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {fileTree.map(node => renderFileNode(node))}
      </div>

      {showStructureImporter && (
        <StructureImporter 
          onImport={handleStructureImport}
          onClose={() => setShowStructureImporter(false)}
        />
      )}
    </div>
  );
};
