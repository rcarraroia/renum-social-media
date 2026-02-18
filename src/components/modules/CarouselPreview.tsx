import React, { useState } from "react";

interface CarouselImage {
  file: File;
  preview: string;
  order: number;
  altText?: string;
}

interface CarouselPreviewProps {
  images: CarouselImage[];
  onConfirm: (images: CarouselImage[]) => void;
  onBack?: () => void;
}

const CarouselPreview: React.FC<CarouselPreviewProps> = ({
  images: initialImages,
  onConfirm,
  onBack
}) => {
  const [images, setImages] = useState(initialImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingAltText, setEditingAltText] = useState(false);
  const [tempAltText, setTempAltText] = useState("");

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 2) {
      alert("Carrossel precisa ter pelo menos 2 imagens");
      return;
    }
    
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Ajustar índice atual se necessário
    if (currentIndex >= newImages.length) {
      setCurrentIndex(newImages.length - 1);
    }
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Atualizar order de todas as imagens
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx
    }));
    
    setImages(reorderedImages);
    setCurrentIndex(toIndex);
  };

  const handleSaveAltText = () => {
    const newImages = [...images];
    newImages[currentIndex] = {
      ...newImages[currentIndex],
      altText: tempAltText
    };
    setImages(newImages);
    setEditingAltText(false);
  };

  const handleEditAltText = () => {
    setTempAltText(currentImage.altText || "");
    setEditingAltText(true);
  };

  return (
    <div className="space-y-4">
      {/* Preview Principal */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <img
            src={currentImage.preview}
            alt={currentImage.altText || `Imagem ${currentIndex + 1}`}
            className="w-full h-96 object-contain rounded bg-slate-50"
          />
          
          {/* Navegação */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition"
          >
            →
          </button>

          {/* Contador */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Informações da imagem */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Imagem {currentIndex + 1} de {images.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleMoveImage(currentIndex, currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-2 py-1 text-xs rounded bg-gray-100 disabled:opacity-50"
              >
                ← Mover
              </button>
              <button
                onClick={() => handleMoveImage(currentIndex, currentIndex + 1)}
                disabled={currentIndex === images.length - 1}
                className="px-2 py-1 text-xs rounded bg-gray-100 disabled:opacity-50"
              >
                Mover →
              </button>
              <button
                onClick={() => handleRemoveImage(currentIndex)}
                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700"
              >
                🗑️ Remover
              </button>
            </div>
          </div>

          {/* Alt Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Texto Alternativo (Alt Text)</label>
              {!editingAltText && (
                <button
                  onClick={handleEditAltText}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  ✏️ Editar
                </button>
              )}
            </div>
            
            {editingAltText ? (
              <div className="space-y-2">
                <textarea
                  value={tempAltText}
                  onChange={(e) => setTempAltText(e.target.value)}
                  placeholder="Descreva esta imagem para acessibilidade..."
                  className="w-full rounded border p-2 text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAltText}
                    className="px-3 py-1 text-sm rounded bg-indigo-600 text-white"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingAltText(false)}
                    className="px-3 py-1 text-sm rounded bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                {currentImage.altText || "Nenhuma descrição adicionada"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Miniaturas */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium mb-3">Todas as imagens</div>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-square rounded overflow-hidden border-2 transition ${
                index === currentIndex
                  ? "border-indigo-500"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img
                src={img.preview}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-0.5">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="text-sm text-slate-600">
          {images.length} imagens no carrossel
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 rounded bg-gray-100 min-h-[44px]"
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={() => onConfirm(images)}
            className="px-3 py-2 rounded bg-indigo-600 text-white min-h-[44px]"
          >
            ✓ Confirmar Carrossel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarouselPreview;
