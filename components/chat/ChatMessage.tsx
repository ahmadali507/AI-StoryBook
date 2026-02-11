import { ChatMessage as ChatMessageType } from '@/types/chat';
import { User, Sparkles, BookOpen, CheckCircle, XCircle, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
    message: ChatMessageType;
    onCharacterSelect?: (characterIds: string[]) => void;
    onShowAllCharacters?: () => void;
    onChapterCountSelect?: (count: number) => void;
    isLoading?: boolean;
}

/**
 * Chat Message Component
 * 
 * Displays a single chat message with enhanced features:
 * - Character preview grid (when characters are generated)
 * - Story progress indicator (during story generation)
 * - Storybook link (when story is complete)
 * - Error states for failed operations
 * 
 * Supports both user and assistant messages with different styling
 */
export function ChatMessage({ message, onCharacterSelect, onShowAllCharacters, onChapterCountSelect, isLoading }: Props) {
    const isUser = message.role === 'user';
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debug logging for pre-made characters
    if (message.preMadeCharacters) {
        console.log('[ChatMessage] Rendering with preMadeCharacters:', {
            count: message.preMadeCharacters.length,
            metadata: message.preMadeCharactersMetadata,
            messageContent: message.content.substring(0, 50)
        });
    }

    const handleCharacterClick = (characterId: string) => {
        if (isSubmitting || isLoading) return;

        setSelectedCharacterIds(prev => {
            // Toggle selection
            if (prev.includes(characterId)) {
                return prev.filter(id => id !== characterId);
            }
            // Max 2 characters
            if (prev.length >= 2) {
                return [prev[1], characterId]; // Replace first with new one
            }
            return [...prev, characterId];
        });
    };

    const handleConfirmSelection = () => {
        if (selectedCharacterIds.length > 0 && onCharacterSelect && !isSubmitting) {
            console.log('[ChatMessage] Confirming selection:', selectedCharacterIds);
            setIsSubmitting(true);
            onCharacterSelect(selectedCharacterIds);
            // Keep submitting state to prevent double-clicks
        }
    };

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] md:max-w-[70%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0
          ${isUser ? 'bg-indigo-600' : 'bg-fuchsia-600'}
        `}>
                    {isUser ? (
                        <User className="w-5 h-5 text-white" />
                    ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                    )}
                </div>

                {/* Message Bubble */}
                <div className={`
          p-4 rounded-2xl text-base leading-relaxed
          ${isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white border-2 border-fuchsia-100 text-slate-800 rounded-tl-sm shadow-sm'}
        `}>
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Pre-Made Character Selection Grid */}
                    {message.preMadeCharacters && message.preMadeCharacters.length > 0 && (
                        <div className="mt-4 space-y-3 animate-slide-up">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-700">
                                    Click to select up to 2 characters
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${selectedCharacterIds.length === 0
                                        ? 'bg-slate-100 text-slate-500'
                                        : 'bg-fuchsia-100 text-fuchsia-700 animate-pulse-glow'
                                        }`}>
                                        {selectedCharacterIds.length}/2
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {message.preMadeCharacters.map((char, index) => {
                                    const isSelected = selectedCharacterIds.includes(char.id);
                                    const selectionOrder = selectedCharacterIds.indexOf(char.id) + 1;
                                    return (
                                        <div
                                            key={char.id}
                                            onClick={() => handleCharacterClick(char.id)}
                                            className="relative group cursor-pointer animate-fade-in"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            {char.imageUrl && (
                                                <div className={`
                                                    aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300
                                                    ${isSelected
                                                        ? 'border-fuchsia-500 ring-4 ring-fuchsia-200 scale-95 shadow-lg'
                                                        : 'border-slate-200 hover:border-fuchsia-400 hover:scale-105 hover:shadow-md'
                                                    }
                                                    ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}>
                                                    <img
                                                        src={char.imageUrl}
                                                        alt={char.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/30 to-purple-600/30 flex items-center justify-center animate-fade-in">
                                                            <div className="w-12 h-12 bg-fuchsia-600 rounded-full flex items-center justify-center shadow-xl animate-pulse-glow relative">
                                                                <Check className="w-7 h-7 text-white" />
                                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-fuchsia-700 text-xs font-bold shadow-md">
                                                                    {selectionOrder}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!isSelected && (
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-2 text-center">
                                                <p className={`text-sm font-semibold transition-colors ${isSelected ? 'text-fuchsia-700' : 'text-slate-700'}`}>
                                                    {char.name}
                                                </p>
                                                <p className="text-xs text-slate-500 capitalize">{char.artStyle}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleConfirmSelection}
                                    disabled={selectedCharacterIds.length === 0 || isSubmitting || isLoading}
                                    className="flex-1 px-4 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Selecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            <span>Confirm Selection {selectedCharacterIds.length > 0 && `(${selectedCharacterIds.length})`}</span>
                                        </>
                                    )}
                                </button>

                                {message.preMadeCharactersMetadata?.hasMore && !message.preMadeCharactersMetadata?.showingAll && !isSubmitting && (
                                    <button
                                        onClick={onShowAllCharacters}
                                        disabled={isLoading}
                                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
                                    >
                                        Show All ({message.preMadeCharactersMetadata.totalCount})
                                    </button>
                                )}
                            </div>

                            {isSubmitting && (
                                <div className="mt-2 p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-lg flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-fuchsia-600" />
                                    <span className="text-sm text-fuchsia-800">Processing your selection...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chapter Count Selection */}
                    {message.chapterCountOptions && onChapterCountSelect && (
                        <div className="mt-4 space-y-3 animate-slide-up">
                            <p className="text-sm font-medium text-slate-700">
                                How many chapters would you like in your story?
                            </p>
                            <div className="grid grid-cols-5 gap-2">
                                {[3, 4, 5, 6, 7].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => onChapterCountSelect(count)}
                                        disabled={isLoading || isSubmitting}
                                        className="relative group p-4 bg-white border-2 border-slate-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <BookOpen className="w-6 h-6 text-fuchsia-600" />
                                            <span className="text-2xl font-bold text-slate-800">{count}</span>
                                            <span className="text-xs text-slate-500">chapters</span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/0 to-purple-500/0 group-hover:from-fuchsia-500/10 group-hover:to-purple-500/10 rounded-xl transition-all" />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-center italic">
                                💡 Recommended: 3-5 chapters for best results
                            </p>
                        </div>
                    )}

                    {/* Character Previews Grid */}
                    {message.characterPreviews && message.characterPreviews.length > 0 && (
                        <div className={`mt-4 grid ${message.characterPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                            {message.characterPreviews.map((char, idx) => (
                                <div key={idx} className="rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-50">
                                    {char.success && char.imageUrl ? (
                                        <>
                                            <div className="aspect-square bg-slate-100 overflow-hidden">
                                                <img
                                                    src={char.imageUrl}
                                                    alt={char.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <p className="font-semibold text-slate-800">{char.name}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <p className="text-xs text-green-600">Created successfully</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-4 bg-red-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <XCircle className="w-5 h-5 text-red-600" />
                                                <p className="font-semibold text-red-900">{char.name}</p>
                                            </div>
                                            <p className="text-xs text-red-700">
                                                Failed: {char.error || 'Unknown error'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Story Progress Indicator - Enhanced */}
                    {message.storyProgress && (
                        <div className="mt-4 p-5 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 rounded-xl border-2 border-purple-300 shadow-lg animate-slide-up">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse-glow">
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    </div>
                                    <div className="absolute inset-0 w-10 h-10 rounded-full bg-indigo-400 animate-ping opacity-20" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-base font-bold text-indigo-900 block">
                                        {message.storyProgress.message}
                                    </span>
                                    <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                                        {message.storyProgress.phase === 'outline' && 'Creating story structure...'}
                                        {message.storyProgress.phase === 'chapters' && 'Writing chapters...'}
                                        {message.storyProgress.phase === 'illustrations' && 'Generating illustrations...'}
                                        {message.storyProgress.phase === 'complete' && 'All done!'}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar with Enhanced Animation */}
                            <div className="relative h-4 bg-indigo-200 rounded-full overflow-hidden mb-3 shadow-inner">
                                <div
                                    className="absolute inset-0 h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-700 ease-out rounded-full"
                                    style={{
                                        width: `${Math.max(5, (message.storyProgress.current / message.storyProgress.total) * 100)}%`
                                    }}
                                >
                                    {/* Progress shimmer */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress-shimmer" />
                                </div>
                                {/* Pulse effect at progress end */}
                                <div
                                    className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-700 ease-out animate-pulse"
                                    style={{
                                        left: `${Math.max(5, (message.storyProgress.current / message.storyProgress.total) * 100)}%`
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-indigo-800 font-bold bg-white/60 px-2 py-1 rounded-full">
                                    {Math.round((message.storyProgress.current / message.storyProgress.total) * 100)}% complete
                                </span>
                                <span className="text-indigo-600 font-medium">
                                    ⏱️ This may take 3-5 minutes...
                                </span>
                            </div>

                            {/* Additional info */}
                            <div className="mt-3 pt-3 border-t border-purple-200">
                                <p className="text-xs text-indigo-700 text-center font-medium">
                                    ✨ We're crafting your story with care - generating chapters and beautiful illustrations
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Storybook Link */}
                    {message.storybookId && (
                        <Link
                            href={`/story/${message.storybookId}`}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full font-medium transition-colors"
                        >
                            <BookOpen className="w-4 h-4" />
                            View Your Story
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
