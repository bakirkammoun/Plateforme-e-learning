import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updatedUser, setUpdatedUser] = useState({ firstName: "", lastName: "", email: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", role: "student", password: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setUpdatedUser({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
      });
    }
  }, [editingUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/admin/users");
      // Filter users to only include "instructor" or "student" roles
      const filteredUsers = response.data.filter((user: User) => user.role === "instructor" || user.role === "student");
      setUsers(filteredUsers);
      setError(null);
    } catch (error) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userToDelete._id}`);
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/admin/users/${editingUser._id}`, updatedUser);
      setUsers(users.map(user => (user._id === editingUser._id ? response.data : user)));
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const addUser = async () => {
    try {
        const response = await axios.post("http://localhost:5000/api/auth/add-user", newUser); // Utiliser /add-user
        setUsers([...users, response.data]);
        setShowAddUser(false);
        setNewUser({ firstName: "", lastName: "", email: "", role: "student", password: "" });
    } catch (error) {
        alert("Failed to add user.");
        console.error("Error:", error); // Afficher l'erreur dans la console pour plus de détails
    }
};


  return (
    <div className="relative">
      {/* Button to add user */}
      <button onClick={() => setShowAddUser(true)} className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
        Add User
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">User Management</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
        ) : (
          <Table className="min-w-full">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-100">Name</TableCell>
                <TableCell className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-100">Email</TableCell>
                <TableCell className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-100">Role</TableCell>
                <TableCell className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-100">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.email}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.role}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 flex gap-2">
                    <button onClick={() => setEditingUser(user)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Edit</button>
                    <button onClick={() => setUserToDelete(user)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center backdrop-blur-lg">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add User</h3>
            <input
              type="text"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            />
            <select
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            >
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              className="mb-4 p-2 border rounded w-full"
            />
            <div className="flex gap-4">
              <button onClick={addUser} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Save</button>
              <button onClick={() => setShowAddUser(false)} className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center backdrop-blur-lg">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit User</h3>
            <input
              type="text"
              placeholder="First Name"
              value={updatedUser.firstName}
              onChange={e => setUpdatedUser({ ...updatedUser, firstName: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={updatedUser.lastName}
              onChange={e => setUpdatedUser({ ...updatedUser, lastName: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            />
            <input
              type="email"
              placeholder="Email"
              value={updatedUser.email}
              onChange={e => setUpdatedUser({ ...updatedUser, email: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            />
            <select
              value={updatedUser.role}
              onChange={e => setUpdatedUser({ ...updatedUser, role: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            >
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
            <div className="flex gap-4">
              <button onClick={handleEditUser} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Save</button>
              <button onClick={() => setEditingUser(null)} className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {userToDelete && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center backdrop-blur-lg">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Are you sure you want to delete this user?</h3>
            <div className="flex gap-4">
              <button onClick={confirmDeleteUser} className="bg-red-500 text-white px-6 py-2 rounded-lg">Delete</button>
              <button onClick={() => setUserToDelete(null)} className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
