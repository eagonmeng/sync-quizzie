import { uuid } from "../engine/util.ts";

export interface UserRecord {
    user: string;
    name: string;
}

export class UserConcept {
    private users: Map<string, UserRecord> = new Map();
    private byName: Map<string, string> = new Map();

    register(
        { user, name }: { user?: string; name: string },
    ): { user: string } {
        const id = user ?? uuid();
        const record: UserRecord = { user: id, name };
        this.users.set(id, record);
        this.byName.set(name, id);
        return { user: id };
    }

    rename({ user, name }: { user: string; name: string }): { user: string } {
        const record = this.users.get(user);
        if (!record) return { user };
        this.byName.delete(record.name);
        record.name = name;
        this.byName.set(name, user);
        return { user };
    }

    _getById({ user }: { user: string }): { user: string; name: string }[] {
        const record = this.users.get(user);
        return record ? [{ user: record.user, name: record.name }] : [];
    }

    _getByName({ name }: { name: string }): { user: string }[] {
        const id = this.byName.get(name);
        return id ? [{ user: id }] : [];
    }
}
