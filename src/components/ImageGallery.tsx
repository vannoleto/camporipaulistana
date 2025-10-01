import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ImageGalleryProps {
  images: Id<"_storage">[];
  onImageDelete?: (storageId: Id<"_storage">) => void;
  showDeleteButton?: boolean;
  className?: string;
}

export function ImageGallery({ 
  images, 
  onImageDelete, 
  showDeleteButton = false,
  className = "" 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const deleteFile = useMutation(api.files.deleteFile);

  const handleDeleteImage = async (storageId: Id<"_storage">) => {
    if (!confirm("Tem certeza que deseja deletar esta imagem?")) {
      return;
    }

    try {
      await deleteFile({ storageId });
      toast.success("Imagem deletada com sucesso!");
      
      if (onImageDelete) {
        onImageDelete(storageId);
      }
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
      toast.error("Erro ao deletar imagem");
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2">Nenhuma imagem encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {images.map((storageId) => (
          <ImageItem
            key={storageId}
            storageId={storageId}
            onImageClick={setSelectedImage}
            onImageDelete={showDeleteButton ? handleDeleteImage : undefined}
          />
        ))}
      </div>

      {/* Modal para visualizar imagem em tamanho completo */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface ImageItemProps {
  storageId: Id<"_storage">;
  onImageClick: (url: string) => void;
  onImageDelete?: (storageId: Id<"_storage">) => void;
}

function ImageItem({ storageId, onImageClick, onImageDelete }: ImageItemProps) {
  const imageUrl = useQuery(api.files.getFileUrl, { storageId });

  if (!imageUrl) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={imageUrl}
        alt="Imagem"
        className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => onImageClick(imageUrl)}
      />
      
      {onImageDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onImageDelete(storageId);
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
