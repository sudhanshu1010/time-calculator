import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})

export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            'https://qdzklqbqqjrxcoqxkiky.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemtscWJxcWpyeGNvcXhraWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjU4NDMsImV4cCI6MjA3NDEwMTg0M30.C9ozRZSa06i8ie6AfVRSFoNucWbNTRsjh-_qZ4zHk6g'
        );
    }

    // Auth Methods
    async signUp(email: string, password: string) {
        return this.supabase.auth.signUp({ email, password });
    }

    async signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }

    async signOut() {
        return this.supabase.auth.signOut();
    }

    async getUser(): Promise<User | null> {
        const { data } = await this.supabase.auth.getUser();
        return data.user;
    }

    // DB insert for time entries later
    async insertTimeEntry(userId: string, day: string, checkIn: string, checkOut: string, totalMinutes: number) {
        return this.supabase.from('time_entries').insert([
            { user_id: userId, day, check_in: checkIn, check_out: checkOut, total_minutes: totalMinutes }
        ]);
    }

    async fetchTimeEntries(userId: string) {
        return this.supabase.from('time_entries').select('*').eq('user_id', userId);
    }

    async clearUserEntries(userId: string) {
        return this.supabase.from('time_entries').delete().eq('user_id', userId);
    }
}