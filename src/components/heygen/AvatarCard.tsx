import React, { useState } from "react";
import { Check, ChevronDown, Volume2 } from "lucide-react";

interface Avatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  gender?: string;
  is_clone?: boolean;
}

interface Voice {
  voice_id: string;
  voice_name: string;
  language?: string;
  gender?: string;
  preview_audio_url?: string;
}

interface AvatarCardProps {
  avatar: Avatar;
  voices: Voice[];
  selectedAvatarId: string;
  selectedVoiceId: string;
  onSelectAvatar: (avatarId: string) => void;
  onSelectVoice: (voiceId: string) => void;
  loadingVoices: boolean;
}

const AvatarCard: React.FC<AvatarCardProps> = ({
  avatar,
  voices,
  selectedAvatarId,
  selectedVoiceId,
  onSelectAvatar,
  onSelectVoice,
  loadingVoices,
}) => {
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const isSelected = selectedAvatarId === avatar.avatar_id;

  console.log(`🎤 AvatarCard ${avatar.avatar_name}: ${voices.length} vozes disponíveis`);

  const handleSelectAvatar = () => {
    onSelectAvatar(avatar.avatar_id);
    setShowVoiceSelector(true);
  };

  const handleSelectVoice = (voiceId: string) => {
    onSelectVoice(voiceId);
    setShowVoiceSelector(false);
  };

  const selectedVoice = voices.find((v) => v.voice_id === selectedVoiceId);

  return (
    <div
      className={`relative border-2 rounded-lg overflow-hidden transition-all ${
        isSelected
          ? "border-primary shadow-sm"
          : "border-border hover:border-primary/50"
      }`}
    >
      {/* Avatar Preview */}
      <div
        className="relative aspect-[3/4] bg-muted cursor-pointer group"
        onClick={handleSelectAvatar}
      >
        {avatar.preview_image_url ? (
          <img
            src={avatar.preview_image_url}
            alt={avatar.avatar_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl text-muted-foreground">👤</div>
          </div>
        )}

        {/* Overlay de seleção */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Badge de clone */}
        {avatar.is_clone && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
            Clone
          </div>
        )}
      </div>

      {/* Informações do Avatar */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="font-medium text-card-foreground truncate">{avatar.avatar_name}</h4>
          {avatar.gender && (
            <p className="text-xs text-muted-foreground capitalize">{avatar.gender}</p>
          )}
        </div>

        {/* Seletor de Voz */}
        {isSelected && (
          <div className="space-y-2">
            <button
              onClick={() => setShowVoiceSelector(!showVoiceSelector)}
              disabled={loadingVoices}
              className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
            >
              <span className="text-sm text-card-foreground truncate">
                {selectedVoice ? selectedVoice.voice_name : "Selecionar voz"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  showVoiceSelector ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown de vozes */}
            {showVoiceSelector && (
              <div className="absolute z-10 left-0 right-0 mx-3 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-sm">
                {loadingVoices ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Carregando vozes...
                  </div>
                ) : voices.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma voz disponível
                  </div>
                ) : (
                  voices.map((voice) => (
                    <button
                      key={voice.voice_id}
                      onClick={() => handleSelectVoice(voice.voice_id)}
                      className={`w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between transition-colors ${
                        selectedVoiceId === voice.voice_id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {voice.voice_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {voice.language} • {voice.gender}
                        </p>
                      </div>
                      {voice.preview_audio_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const audio = new Audio(voice.preview_audio_url);
                            audio.play();
                          }}
                          className="ml-2 p-1 hover:bg-muted rounded transition-colors"
                          title="Ouvir preview"
                        >
                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      {selectedVoiceId === voice.voice_id && (
                        <Check className="w-4 h-4 text-primary ml-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarCard;
