import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const creatorUsername = localStorage.getItem('username'); // Replace with actual logic

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5003/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, creatorUsername }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Group "${data.group.name}" created successfully!`);
        setError('');
        setGroupName('');
        setTimeout(() => navigate(`/group/${data.group._id}`), 2000); // Redirect after success
      } else {
        setError(data.message || 'Error creating group');
        setSuccess('');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Create a Group</h2>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter Group Name"
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading ? '#ccc' : '#007BFF',
            color: '#fff',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
}

export default CreateGroup;
