import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const FileUploader = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const cleanTextContent = (text: string): string => {
    return text
      .replace(/\0/g, '')
      .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
      .replace(/\\u0000/g, '')
      .trim();
  };

  const validateFileContent = (content: string): boolean => {
    if (!content || content.length === 0) {
      throw new Error('File is empty');
    }
    
    if (content.length < 10) {
      throw new Error('File content is too short');
    }

    return true;
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const result = e.target?.result;
            if (typeof result !== 'string') {
              reject(new Error('Failed to read file as text'));
              return;
            }

            const cleanedContent = cleanTextContent(result);
            console.log('Content length before cleaning:', result.length);
            console.log('Content length after cleaning:', cleanedContent.length);

            if (validateFileContent(cleanedContent)) {
              resolve(cleanedContent);
            }
          } catch (error) {
            console.error('Error processing file:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(selectedFile);
      });

      console.log('Requesting file embedding generation...');
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        'generate-file-embedding',
        {
          body: { text }
        }
      );

      if (embeddingError) {
        console.error('Embedding error:', embeddingError);
        throw embeddingError;
      }

      if (!embeddingData?.embedding) {
        throw new Error('No embedding data received');
      }

      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      const fileId = crypto.randomUUID();

      const { error: uploadError } = await supabase.storage
        .from("knowledge_base")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("knowledge_base_files").insert({
        id: fileId,
        filename: selectedFile.name,
        file_path: filePath,
        content_type: selectedFile.type,
        size: selectedFile.size,
        user_id: user.id,
        content: text,
        embedding: embeddingData.embedding
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded and processed successfully",
      });

      setSelectedFile(null);
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Upload New File</h2>
      <div className="flex gap-4">
        <Input
          type="file"
          accept=".txt,.md,.doc,.docx"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="flex-1"
        />
        <Button
          onClick={handleFileUpload}
          disabled={!selectedFile || isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
};