export interface Contact{
    id: string;
    name: string;
    phone?: string;
    relation: string;
    status: 'unknown' | 'safe' |
    'help' | 'emergency';
    lastSeen: number;
    lastLocation?: {
        lat: number;
        lng: number;
    };
};

class ContactManager {
    private contacts: Contact[] = [];
    private storageKey = 'pulselink-contacts';

    constructor() {
        this.loadFromStorage();
    }

    addContact(contact: Omit<Contact, 'id' | 'status'>): Contact{
        const newContact: Contact = {
            ...contact,
            id: `contact-${Date.now()}-${Math.random()}`,
            status: 'unknown',
        };
        this.contacts.push(newContact);
        this.saveToStorage();
        return newContact;
    }

    updateContactStatus(id: string, status: Contact['status'], location?:{
        lat: number; lng: number
    }) {
        const contact = this.contacts.find(C => C.id === id);
        if(contact){
            contact.status = status;
            contact.lastSeen = Date.now();
            if(location){
                contact.lastLocation = location;
            }
            this.saveToStorage();
        }
    }

    deleteContact(id: string){
        this.contacts = this.contacts.filter(c => c.id !==id);
        this.saveToStorage();
    }

    getContacts(): Contact[]{
        return [...this.contacts];
    }

    getContact(id: string): Contact | undefined {
        return this.contacts.find (c => c.id === id);
    }

    private saveToStorage(){
        if(typeof window !== 'undefined'){
            localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
        }
    }

    private loadFromStorage(){
        if(typeof window !== 'undefined'){
            const stored = localStorage.getItem(this.storageKey);
            if(stored){
                this.contacts = JSON.parse(stored);
            }
        }
    }
}

export default ContactManager;