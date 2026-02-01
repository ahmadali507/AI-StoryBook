import { ChatMessage as ChatMessageType } from '@/types/chat';
import { User, Sparkles } from 'lucide-react';

interface Props {
    message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
    const isUser = message.role === 'user';

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
                </div>
            </div>
        </div>
    );
}
