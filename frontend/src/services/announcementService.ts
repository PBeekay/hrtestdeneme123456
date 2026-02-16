import axios from 'axios';
import config from '../config/env';

const ANNOUNCEMENTS_API = `${config.apiUrl}/api/announcements`;

// Helper to get auth header (duplicating from other services or reusing if centralized)
const getAuthDetails = () => {
    const token = localStorage.getItem('authToken');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const announcementService = {
    // Create a new announcement
    createAnnouncement: async (data: { title: string; content: string; category: string; announcement_date?: string }) => {
        try {
            const response = await axios.post(ANNOUNCEMENTS_API, data, getAuthDetails());
            return response.data;
        } catch (error) {
            console.error('Create announcement error:', error);
            throw error;
        }
    },

    // Update announcement
    updateAnnouncement: async (id: number, data: { title: string; content: string; category: string; announcement_date?: string }) => {
        try {
            const response = await axios.put(`${ANNOUNCEMENTS_API}/${id}`, data, getAuthDetails());
            return response.data;
        } catch (error) {
            console.error('Update announcement error:', error);
            throw error;
        }
    },

    // Get active announcements (optional, usually fetched via dashboard)
    getAnnouncements: async (limit: number = 10) => {
        try {
            const response = await axios.get(`${ANNOUNCEMENTS_API}?limit=${limit}`, getAuthDetails());
            return response.data;
        } catch (error) {
            console.error('Get announcements error:', error);
            throw error;
        }
    },

    // Delete an announcement
    deleteAnnouncement: async (id: number) => {
        try {
            const response = await axios.delete(`${ANNOUNCEMENTS_API}/${id}`, getAuthDetails());
            return response.data;
        } catch (error) {
            console.error('Delete announcement error:', error);
            throw error;
        }
    }
};
