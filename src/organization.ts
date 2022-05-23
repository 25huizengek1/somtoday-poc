/*
    SOMtoday POC - Dit programma voert eerst de POC van @Fish-o uit, daarna die van @25huizengek1 (GitHub), om te kijken welke wel/niet werkt per school
    Copyright (C) 2022  25huizengek1

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import axios from "axios"

export async function getOrganizations(): Promise<Array<Organization>> {
    return axios.get("https://servers.somtoday.nl/organisaties.json")
        .then(r => r.data[0].instellingen.map((org: { uuid: string; naam: string; plaats: string; }) => new Organization(org.uuid, org.naam, org.plaats)))
}

export async function findOrganization(query: String) {
    const queryLowerCase = query.toLowerCase()
    return getOrganizations().then(orgs => orgs.find(o => o.name.toLowerCase().includes(queryLowerCase)))
}

export class Organization {
    uuid: string
    name: string
    location: string

    constructor(uuid: string, name: string, location: string) {
        this.uuid = uuid
        this.name = name
        this.location = location
    }
}