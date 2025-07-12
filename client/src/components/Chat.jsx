import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import RingLoader from 'react-spinners/RingLoader';
const baseURL = "http://localhost:8080";
import { v4 as uuid4 } from 'uuid';
import RenderPlotlyFigure from './RenderPlotyFigure';


const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [neo4jDataBase, setNeo4jDataBase] = useState("neo4j");
    const [threadId, setThreadId] = useState(uuid4())

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userInput.trim()) return;  // Don't send empty messages

        // Add the user message to the conversation
        setMessages([...messages, { text: userInput, sender: 'user' }]);
        setUserInput('');
        setLoading(true);

        try {
            const response = await fetch(`${baseURL}/chat`, {
                method: 'POST',
                headers: {"Content-Type": "application/json" },
                body: JSON.stringify({query: userInput, threadId: threadId}),
                redirect: 'follow',
                mode: 'cors'
            });
            const data = await response.json();
            console.dir(data)
            const resultText = data.at(-1).content
            // Add the response to the conversation
            setMessages(prevMessages => [
                ...prevMessages,
                { text: resultText, sender: 'ai' }
            ]);
        } catch (error) {
            console.error('Error Initiating Chat:', error);

        } finally {
            setLoading(false);
        }

        console.log("messages")
        console.log(messages)
    };

    return (
        <div className="chat-container">
            <div className="chat-window">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.sender}`}>
                    {message.sender === 'ai' ? (() => {
                    let parsed;
                    try {
                        parsed = JSON.parse(message.text);
                    } catch {
                        parsed = null;
                    }

                    if (parsed && parsed.type) {
                        switch (parsed.type) {
                        case 'plotly':
                            return <RenderPlotlyFigure jsonUrl={parsed.data.url} />;
                        case 'text':
                            return <ReactMarkdown>{parsed.data.content}</ReactMarkdown>;
                        // add other types if needed
                        default:
                            return <ReactMarkdown>{message.text}</ReactMarkdown>;
                        }
                    }

                    // fallback: just render markdown if no JSON or no type
                    return <ReactMarkdown>{message.text}</ReactMarkdown>;
                    })() : (
                    <p>{message.text}</p>
                    )}
                    </div>
                ))}
                {loading && <div className="message ai"><RingLoader/></div>}
            </div>
            <form className="chat-form" onSubmit={handleSubmit}>
                <input
                    className="chat-input"
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button className="chat-button" type="submit">Send</button>
            </form>
        </div>
    );
};

export default Chat;