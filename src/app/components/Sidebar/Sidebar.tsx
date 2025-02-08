"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useTheme } from '../../contexts/ThemeContext';
import './sidebar.css';
import { Conversation, Message } from '../../types/sidebar';

interface SidebarProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const timestamp = new Date(date);
  const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const Sidebar = ({ conversations, onSelect }: SidebarProps) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarState');
    if (savedState) {
      try {
        const { expanded, selected } = JSON.parse(savedState);
        setExpandedSections(new Set(expanded));
        setSelectedId(selected);
      } catch (error) {
        console.error('Failed to parse saved sidebar state:', error);
      }
    }
  }, []);

  // Save state on changes
  const saveSidebarState = useCallback((expanded: Set<string>, selected: string | null) => {
    try {
      localStorage.setItem('sidebarState', JSON.stringify({
        expanded: Array.from(expanded),
        selected
      }));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => 
      conv.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conversations, searchQuery]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSidebarState(next, selectedId);
      return next;
    });
  }, [selectedId, saveSidebarState]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    onSelect(id);
    saveSidebarState(expandedSections, id);
  }, [expandedSections, onSelect, saveSidebarState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSelect(id);
    } else if (e.key === 'ArrowRight') {
      setExpandedSections(prev => {
        const next = new Set(prev).add(id);
        saveSidebarState(next, selectedId);
        return next;
      });
    } else if (e.key === 'ArrowLeft') {
      setExpandedSections(prev => {
        const next = new Set(prev);
        next.delete(id);
        saveSidebarState(next, selectedId);
        return next;
      });
    }
  }, [handleSelect, selectedId, saveSidebarState]);

  return (
    <nav 
      className={`sidebar ${theme}-theme`}
      role="navigation"
      aria-label="Conversation history"
    >
      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search conversations"
          className="search-input"
        />
      </div>

      <Virtuoso
        className="virtual-list"
        totalCount={filteredConversations.length}
        itemContent={(index: number) => {
          const conv = filteredConversations[index];
          const isExpanded = expandedSections.has(conv.id);
          const lastMessage = conv.messages[conv.messages.length - 1];

          return (
            <div 
              key={conv.id}
              className={`conversation-item ${selectedId === conv.id ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(conv.id)}
              onKeyDown={(e) => handleKeyDown(e, conv.id)}
              aria-label={`Conversation with ${conv.participants.join(', ')}${conv.unreadCount ? `, ${conv.unreadCount} unread messages` : ''}`}
              aria-expanded={isExpanded}
            >
              <div className="conv-header">
                <div className="conv-title">
                  <button
                    className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(conv.id);
                    }}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} conversation`}
                  >
                    ▼
                  </button>
                  <div className="participants">
                    {conv.participants.map((p, i) => (
                      <span key={i} className="participant">
                        {p}{i < conv.participants.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="unread-count" aria-label={`${conv.unreadCount} unread messages`}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <span className="timestamp" title={new Date(lastMessage?.timestamp || conv.updatedAt).toLocaleString()}>
                  {formatTimestamp(lastMessage?.timestamp || conv.updatedAt)}
                </span>
              </div>
              
              {isExpanded && (
                <div className="message-preview">
                  {conv.messages.slice(-2).map((msg: Message) => (
                    <div key={msg.id} className="message-line">
                      <span className="message-type">{msg.type}: </span>
                      <span className="message-content">{msg.content}</span>
                      <span className="message-status">{msg.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
    </nav>
  );
};

export default Sidebar;