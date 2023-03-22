/**
 * Structure de donnée d'ensembles disjoints, inspirée du code de Andrii Heonia, 2014
 * https://github.com/AndriiHeonia/disjoint-set
 */

import { CoordSetObject } from '@app/services/disjoint-sets/coord-set-object';

export class DisjointSet {
    private objects: CoordSetObject[] = [];
    private relations: number[] = [];
    private size: number[] = [];
    private lastId = 0;

    add(val: CoordSetObject) {
        // Si l'objet n'existe pas déjà dans l'ensemble disjoint
        if (val.setId === undefined) {
            const id = this.lastId;
            this.lastId++;
            val.setId = id;
            this.relations[id] = id;
            this.objects[id] = val;
            this.size[id] = 1;
        }
        return this;
    }

    find(val: CoordSetObject) {
        // Vérifier que l'objet a un inentifiant
        if (val.setId !== undefined) {
            return this.findById(val.setId);
        }
    }

    connected(val1: CoordSetObject, val2: CoordSetObject) {
        return this.find(val1) === this.find(val2);
    }

    union(val1: CoordSetObject, val2: CoordSetObject) {
        const val1RootId = this.find(val1);
        const val2RootId = this.find(val2);

        if (val1RootId === val2RootId) {
            return this;
        }

        if (this.size[val1RootId] < this.size[val2RootId]) {
            this.relations[val1RootId] = val2RootId;
            this.size[val1RootId] += this.size[val2RootId];
        } else {
            this.relations[val2RootId] = val1RootId;
            this.size[val2RootId] += this.size[val1RootId];
        }

        return this;
    }

    getSetLists(): CoordSetObject[][] {
        let rootId: number;
        const joinedSet = {};
        const joinedSetsList = [];

        for (const id of Object.keys(this.relations)) {
            rootId = this.findById(parseInt(id, 10));

            if (typeof joinedSet[rootId] === 'undefined') {
                joinedSet[rootId] = [];
            }
            joinedSet[rootId].push(this.objects[id]);
        }

        for (const key1 of Object.keys(joinedSet)) {
            joinedSetsList.push(joinedSet[key1]);
        }

        return joinedSetsList;
    }

    private findById(id: number): number {
        let rootId = id;
        while (this.relations[rootId] !== rootId) {
            rootId = this.relations[rootId];
        }
        return rootId;
    }
}
