import React, { useState, useRef, useEffect } from "react";
import { Upload, FileImage, Sparkles, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
  description: string;
  status?: "analyzing" | "completed";
}

const Index = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("http://localhost:5050/api/images");
      if (response.ok) {
        const data = await response.json();
        setImages(
          data.map((img: any) => ({
            ...img,
            status: "completed",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
      toast.error("Failed to load images");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG/PNG)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    toast.success("Image selected! Click upload to analyze.");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("http://localhost:5050/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        // Add the new image to the list
        setImages((prev) => [
          {
            ...result,
            status: "completed",
          },
          ...prev,
        ]);

        toast.success("Image uploaded and analyzed successfully!");

        // Reset form
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/image/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        toast.success("Image deleted successfully");
      } else {
        toast.error("Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting the image");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 font-outfit">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-orange-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              AI Image Analyzer
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Upload Section */}
        <Card className="mb-6 sm:mb-8 bg-white/70 backdrop-blur-lg border-orange-200/50 shadow-2xl hover:shadow-orange-200/30 transition-all duration-300">
          <CardContent className="p-4 sm:p-8">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={triggerFileSelect}
                className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-orange-300/60 rounded-xl hover:border-orange-400 transition-all duration-300 cursor-pointer hover:bg-orange-50/50 group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                    {selectedFile
                      ? `Selected: ${selectedFile.name}`
                      : "Choose an image"}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm px-4 text-center">
                    Click to browse • JPEG, PNG up to 5MB
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-lg border-2 border-orange-200">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isUploading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Uploading & Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Analyze
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            {/* 🔴 Delete Button */}
          </CardContent>
        </Card>

        {/* Results Grid */}
        {images.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <FileImage className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              Analyzed Images ({images.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className="group bg-white/80 backdrop-blur-lg border-orange-200/50 shadow-xl hover:shadow-2xl hover:shadow-orange-200/20 transition-all duration-500 overflow-hidden hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={`http://localhost:5050/api/upload/${
                        image.fileName || image.originalName
                      }`}
                      alt={image.originalName || image.fileName}
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback if image doesn't load from server
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                      <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs font-medium backdrop-blur-md border shadow-lg bg-green-500/90 text-white border-green-300">
                        Completed
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-bold text-gray-800 mb-2 truncate text-base sm:text-lg">
                      {image.originalName || image.fileName}
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="truncate">
                        {new Date(image.uploadedAt).toLocaleDateString()} at{" "}
                        {new Date(image.uploadedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold">
                          AI Description
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic">
                          "{image.description}"
                        </p>
                      </div>
                      {image.size && (
                        <div className="text-xs text-gray-400">
                          Size: {Math.round(image.size / 1024)} KB
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                      className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-lg shadow"
                    >
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="p-6 sm:p-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-2xl">
              <FileImage className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">
              No images uploaded yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-base sm:text-lg px-4">
              Upload your first image to see the AI analysis in action. The
              system will analyze and describe your images automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
