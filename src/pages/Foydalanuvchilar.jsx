import { useState, useEffect, useRef } from "react";
import { getUsersApi, getUserMessagesApi, sendUserMessageApi } from "../utils/api";
import toast from "react-hot-toast";

const Foydalanuvchilar = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendAsImage, setSendAsImage] = useState(true); // true = image preview, false = file attachment
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageCaption, setImageCaption] = useState("");
  const [compressImage, setCompressImage] = useState(true);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [messageText]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      try {
        const data = await getUsersApi();
        if (data && Array.isArray(data)) {
          setUsers(data);
          localStorage.setItem("foydalanuvchilar_list", JSON.stringify(data));
        } else {
          const saved = localStorage.getItem("foydalanuvchilar_list");
          if (saved) {
            setUsers(JSON.parse(saved));
          } else {
            // Test users data
            const testUsers = [
              {
                id: 1,
                user_id: 123456789,
                full_name: "Ali Valiyev",
                phone_number: "+998901234567",
              },
              {
                id: 2,
                user_id: 987654321,
                full_name: "Dilshod Karimov",
                phone_number: "+998907654321",
              },
              {
                id: 3,
                user_id: 555666777,
                full_name: "Olimjon Toshmatov",
                phone_number: "+998901112233",
              },
              {
                id: 4,
                user_id: 111222333,
                full_name: "Malika Qosimova",
                phone_number: "+998904445566",
              },
              {
                id: 5,
                user_id: 444555666,
                full_name: "Sardor Yuldashev",
                phone_number: "+998907778899",
              },
            ];
            setUsers(testUsers);
            localStorage.setItem("foydalanuvchilar_list", JSON.stringify(testUsers));
          }
        }
      } catch (apiError) {
        // If API fails, try to load from localStorage
        const saved = localStorage.getItem("foydalanuvchilar_list");
        if (saved) {
          setUsers(JSON.parse(saved));
        } else {
          // Test users data
          const testUsers = [
            {
              id: 1,
              user_id: 123456789,
              full_name: "Ali Valiyev",
              phone_number: "+998901234567",
            },
            {
              id: 2,
              user_id: 987654321,
              full_name: "Dilshod Karimov",
              phone_number: "+998907654321",
            },
            {
              id: 3,
              user_id: 555666777,
              full_name: "Olimjon Toshmatov",
              phone_number: "+998901112233",
            },
            {
              id: 4,
              user_id: 111222333,
              full_name: "Malika Qosimova",
              phone_number: "+998904445566",
            },
            {
              id: 5,
              user_id: 444555666,
              full_name: "Sardor Yuldashev",
              phone_number: "+998907778899",
            },
          ];
          setUsers(testUsers);
          localStorage.setItem("foydalanuvchilar_list", JSON.stringify(testUsers));
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      const saved = localStorage.getItem("foydalanuvchilar_list");
      if (saved) {
        setUsers(JSON.parse(saved));
      } else {
        // Test users data
        const testUsers = [
          {
            id: 1,
            user_id: 123456789,
            full_name: "Ali Valiyev",
            phone_number: "+998901234567",
          },
          {
            id: 2,
            user_id: 987654321,
            full_name: "Dilshod Karimov",
            phone_number: "+998907654321",
          },
          {
            id: 3,
            user_id: 555666777,
            full_name: "Olimjon Toshmatov",
            phone_number: "+998901112233",
          },
          {
            id: 4,
            user_id: 111222333,
            full_name: "Malika Qosimova",
            phone_number: "+998904445566",
          },
          {
            id: 5,
            user_id: 444555666,
            full_name: "Sardor Yuldashev",
            phone_number: "+998907778899",
          },
        ];
        setUsers(testUsers);
        localStorage.setItem("foydalanuvchilar_list", JSON.stringify(testUsers));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    const userId = selectedUser.id || selectedUser.user_id;
    if (!userId) return;
    
    try {
      try {
        const data = await getUserMessagesApi(userId);
        if (data && Array.isArray(data)) {
          setMessages(data);
          localStorage.setItem(`user_messages_${userId}`, JSON.stringify(data));
        } else {
          const saved = localStorage.getItem(`user_messages_${userId}`);
          if (saved) {
            setMessages(JSON.parse(saved));
          } else {
            setMessages([]);
          }
        }
      } catch (apiError) {
        // If API fails, try to load from localStorage
        const saved = localStorage.getItem(`user_messages_${userId}`);
        if (saved) {
          setMessages(JSON.parse(saved));
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      const saved = localStorage.getItem(`user_messages_${userId}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type?.startsWith("image/")) {
        // Show modal for images
        setSelectedFile(file);
        setShowImageModal(true);
        setImageCaption("");
        setCompressImage(true);
        setSendAsImage(true);
      } else {
        // For non-image files, add directly
        setSelectedFile(file);
        setSendAsImage(false);
      }
    }
  };

  const handleImageModalSend = async () => {
    if (!selectedFile || !selectedUser) {
      return;
    }

    try {
      setSending(true);
      setShowImageModal(false);

      // Determine send format based on compress checkbox
      // compressImage: true (checked) = katta format (to'liq preview)
      // compressImage: false (unchecked) = kichik format (fayl sifatida)
      const shouldSendAsImage = compressImage; // If compressed checkbox is checked, send as full image preview

      const newMessage = {
        id: Date.now(),
        text: imageCaption.trim(),
        file: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          url: URL.createObjectURL(selectedFile),
          sendAsImage: shouldSendAsImage && selectedFile.type?.startsWith("image/"),
        },
        timestamp: new Date().toISOString(),
        sender: "admin",
        senderName: "Admin",
      };

      // Add to UI immediately
      const updated = [...messages, newMessage];
      setMessages(updated);
      const userId = selectedUser.id || selectedUser.user_id;
      
      // Convert file to base64 for storage
      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newMessage.file.data = reader.result;
          localStorage.setItem(`user_messages_${userId}`, JSON.stringify(updated));
        };
        reader.readAsDataURL(selectedFile);
      } else {
        localStorage.setItem(`user_messages_${userId}`, JSON.stringify(updated));
      }

      // Try to send via API
      try {
        // await sendUserMessageApi(userId, imageCaption.trim(), selectedFile);
      } catch (apiError) {
        console.log("API not available, saved locally");
      }

      toast.success("Rasm yuborildi");
      setImageCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending image:", error);
      toast.error("Rasm yuborishda xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  const handleImageModalCancel = () => {
    setShowImageModal(false);
    setSelectedFile(null);
    setImageCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setSendAsImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = messageText;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setMessageText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessageText(messageText + emoji);
    }
    setShowEmojiPicker(false);
  };

  const commonEmojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !selectedFile) || !selectedUser) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: messageText.trim(),
      file: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile), // For preview
        sendAsImage: sendAsImage && selectedFile.type?.startsWith("image/"), // Flag to determine display style
      } : null,
      timestamp: new Date().toISOString(),
      sender: "admin",
      senderName: "Admin",
    };

    try {
      setSending(true);
      
      // Add to UI immediately
      const updated = [...messages, newMessage];
      setMessages(updated);
      const userId = selectedUser.id || selectedUser.user_id;
      // Convert file to base64 for storage
      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newMessage.file.data = reader.result;
          localStorage.setItem(`user_messages_${userId}`, JSON.stringify(updated));
        };
        reader.readAsDataURL(selectedFile);
      } else {
        localStorage.setItem(`user_messages_${userId}`, JSON.stringify(updated));
      }
      
      // Try to send via API
      try {
        const formData = new FormData();
        formData.append("message", messageText.trim());
        if (selectedFile) {
          formData.append("file", selectedFile);
        }
        // await sendUserMessageApi(userId, messageText.trim(), selectedFile);
      } catch (apiError) {
        console.log("API not available, saved locally");
      }

      toast.success("Xabar yuborildi");
      setMessageText("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(messages);
      const userId = selectedUser.id || selectedUser.user_id;
      localStorage.setItem(`user_messages_${userId}`, JSON.stringify(messages));
      
      const errorMessage =
        error.responseData?.detail ||
        error.responseData?.message ||
        error.message ||
        "Xabar yuborishda xatolik yuz berdi";
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const getFilteredUsers = () => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(query) ||
        user.user_id?.toString().includes(query) ||
        user.phone_number?.includes(query)
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Kecha";
    } else if (days < 7) {
      const weekDays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
      return weekDays[date.getDay()];
    } else {
      return date.toLocaleDateString("uz-UZ", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const formatDateHeader = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  const groupMessagesByDate = () => {
    const grouped = {};
    messages.forEach((message) => {
      const date = new Date(message.timestamp);
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });
    return grouped;
  };

  const filteredUsers = getFilteredUsers();
  const groupedMessages = groupMessagesByDate();

  const getLastMessage = (userId) => {
    if (!userId) return null;
    const saved = localStorage.getItem(`user_messages_${userId}`);
    if (saved) {
      try {
        const userMessages = JSON.parse(saved);
        if (Array.isArray(userMessages) && userMessages.length > 0) {
          // Sort by timestamp to get the most recent message
          const sorted = [...userMessages].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          const lastMsg = sorted[0];
          const messageText = lastMsg?.text || lastMsg?.message || "";
          if (messageText && lastMsg?.timestamp) {
            return {
              text: messageText,
              timestamp: lastMsg.timestamp,
            };
          }
        }
      } catch (e) {
        console.error("Error parsing messages:", e);
      }
    }
    return null;
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-pink-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-screen flex flex-col -mx-6 -my-8 bg-white dark:bg-gray-900 overflow-hidden" style={{ height: '93vh' }}>
      {/* Header */}
      

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Users List */}
        <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Foydalanuvchilar ro'yxati ({users.length})
            </h2>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-white dark:bg-gray-800">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Foydalanuvchilar topilmadi
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => {
                  const userName = user.full_name || user.user?.full_name || "Foydalanuvchi";
                  const userId = user.id || user.user_id;
                  const lastMessage = getLastMessage(userId);
                  const isSelected = selectedUser?.id === userId || selectedUser?.user_id === userId;
                  
                  return (
                    <div
                      key={userId}
                      onClick={() => setSelectedUser(user)}
                      className={`p-3 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-12 h-12 ${getAvatarColor(userName)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-medium text-sm">
                            {getInitials(userName)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-gray-900 dark:text-white truncate text-sm">
                              {userName}
                            </div>
                            {lastMessage && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                {formatLastMessageTime(lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          {lastMessage && lastMessage.text ? (
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {lastMessage.text.length > 50 
                                ? lastMessage.text.substring(0, 50) + "..." 
                                : lastMessage.text}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                              Xabar yo'q
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="h-24 w-24 text-gray-400 dark:text-gray-500 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Foydalanuvchini tanlang
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Muloqot qilish uchun chapdagi ro'yxatdan foydalanuvchini tanlang
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {(selectedUser.full_name || selectedUser.user?.full_name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedUser.full_name || selectedUser.user?.full_name || "Foydalanuvchi"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        User ID: {selectedUser.user_id || selectedUser.user?.user_id || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 dark:bg-gray-900/50" style={{ flex: '1 1 0', overflowY: 'auto', minHeight: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)' }}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Hali hech qanday xabar yo'q
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {Object.entries(groupedMessages)
                      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                      .map(([dateKey, dateMessages]) => (
                        <div key={dateKey} className="space-y-3">
                          {/* Date Separator */}
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs font-medium px-4 py-1.5 rounded-full">
                              {formatDateHeader(dateMessages[0].timestamp)}
                            </div>
                          </div>

                          {/* Messages for this date */}
                          {dateMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex items-start gap-3 ${
                                message.sender === "admin" ? "flex-row-reverse" : ""
                              }`}
                            >
                              {message.sender !== "admin" && (
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-medium">
                                    {(message.senderName || "U").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className={`flex-1 min-w-0 ${message.sender === "admin" ? "flex flex-col items-end" : ""}`}>
                                {message.file && (
                                  <div className={`mb-2 ${message.sender === "admin" ? "flex flex-col items-end" : ""}`}>
                                    {message.file.sendAsImage && message.file.type?.startsWith("image/") ? (
                                      // Image preview - full size
                                      <div className="relative inline-block">
                                        <img
                                          src={message.file.url || message.file.data}
                                          alt={message.file.name}
                                          className="max-w-xs rounded-lg cursor-pointer"
                                          onClick={() => window.open(message.file.url || message.file.data, "_blank")}
                                        />
                                        <div className={`absolute bottom-2 right-2 flex items-center gap-1 ${
                                          message.sender === "admin" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                        }`}>
                                          <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded">
                                            {formatTime(message.timestamp)}
                                          </span>
                                          {message.sender === "admin" && (
                                            <svg
                                              className="h-3 w-3"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      // File attachment - compact view
                                      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border max-w-xs ${
                                        message.sender === "admin"
                                          ? "bg-blue-500/10 dark:bg-blue-500/20 border-blue-400/30 dark:border-blue-400/50 text-blue-100"
                                          : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                      }`}>
                                        {message.file.type?.startsWith("image/") ? (
                                          <img
                                            src={message.file.url || message.file.data}
                                            alt={message.file.name}
                                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {message.file.name}
                                          </p>
                                          <p className="text-xs opacity-70 mt-0.5">
                                            {(message.file.size / 1024).toFixed(1)} KB
                                          </p>
                                          <p className="text-xs opacity-60 mt-1">
                                            OPEN WITH
                                          </p>
                                        </div>
                                        <div className={`flex items-center gap-1 flex-shrink-0 ${
                                          message.sender === "admin" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                        }`}>
                                          <span className="text-xs">
                                            {formatTime(message.timestamp)}
                                          </span>
                                          {message.sender === "admin" && (
                                            <svg
                                              className="h-3 w-3"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {message.text && (
                                  <div
                                    className={`rounded-2xl px-4 py-2.5 inline-block max-w-full relative ${
                                      message.sender === "admin"
                                        ? "bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm"
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-12">
                                      {message.text}
                                    </p>
                                    <div className={`absolute bottom-2 right-2 flex items-center gap-1 ${
                                      message.sender === "admin" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                      <span className="text-xs">
                                        {formatTime(message.timestamp)}
                                      </span>
                                      {message.sender === "admin" && (
                                        <svg
                                          className="h-3 w-3"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input Area - Telegram Style */}
              <div className="relative bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 pt-2 flex-shrink-0">
                {/* Selected File Preview - Always show small thumbnail */}
                {selectedFile && !showImageModal && (
                  <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {selectedFile.type?.startsWith("image/") ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt={selectedFile.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                            {compressImage ? " (siqilgan)" : " (siqilmagan)"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                        >
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="emoji-picker-container absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 max-h-64 overflow-y-auto z-50" style={{ width: '300px' }}>
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Xabar yozing..."
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600 min-h-[44px] max-h-[200px]"
                      rows={1}
                      style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      onFocus={() => setShowEmojiPicker(false)}
                    />
                    <style>{`
                      textarea::-webkit-scrollbar {
                        display: none;
                      }
                      textarea {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                    `}</style>
                    {/* Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Send Button */}
                  {(messageText.trim() || selectedFile) && (
                    <button
                      type="submit"
                      disabled={sending}
                      className="flex-shrink-0 p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Send Modal */}
      {showImageModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rasm yuborish
              </h3>
            </div>

            {/* Image Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mb-4">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt={selectedFile.name}
                  className="w-full rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleImageModalCancel}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">
                Rasmni tahrirlash uchun ustiga bosing
              </p>

              {/* Compress Checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compressImage}
                    onChange={(e) => setCompressImage(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Rasmini siqish
                  </span>
                </label>
              </div>

              {/* Caption Input */}
              <div className="relative">
                <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 p-2">
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Izoh qo'shing..."
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {/* Emoji Picker in Modal */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 max-h-48 overflow-y-auto z-50" style={{ width: '300px' }}>
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageCaption(imageCaption + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Qo'shish
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleImageModalCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleImageModalSend}
                  disabled={sending}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {sending ? "Yuborilmoqda..." : "Yuborish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Foydalanuvchilar;

