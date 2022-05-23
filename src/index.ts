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

import axios, { AxiosError, AxiosResponse } from "axios"
import { findOrganization } from "./organization"
import crypto from "crypto"
import qs from "qs"
import { schoolName, username, password } from "../config.json"

// --
// CONSTANTS
const REDIRECT_URI = "somtodayleerling://oauth/callback"
const CLIENT_ID = "D50E0C06-32D1-4B41-A137-A9A850C892C2";
// --

(async () => {
    console.log("----------------")
    console.log("  SOMtoday POC  ")
    console.log("----------------\n")
    console.log("Dit programma voert eerst de POC van @Fish-o uit, daarna die van @25huizengek1 (GitHub), om te kijken welke wel/niet werkt per school")

    console.log(`Organisatie ${schoolName} laden....`)
    const organization = await findOrganization(schoolName)
    if (typeof organization === "undefined") {
        return console.log("Geen organisatie gevonden, probeer een andere naam of fix je internet :)")
    }
    console.log(`Organisatie gevonden:\n${JSON.stringify(organization)}\n`)

    console.log("POC van Fish-o proberen...");
    
    const fishSuccess = await new Promise(res => {
        const authVariables = generateAuthVariables()
        console.log(`authVariables: ${JSON.stringify(authVariables)}`)
        axios.get("https://inloggen.somtoday.nl/oauth2/authorize", {
            params: {
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                response_type: "code",
                state: generateRandomString(8),
                scope: "openid",
                tenant_uuid: organization.uuid,
                session: "no_session",
                code_challenge: authVariables.challenge,
                code_challenge_method: "S256"
            },
            maxRedirects: 0
        }).catch((err: AxiosError) => {
            const authToken = (new URL(err.response!.headers.location!)).searchParams.get("auth")
            if (typeof authToken !== "string") {
                res(false)
                return console.log("authToken niet gevonden (Fish-o)\n")
            }
            console.log(`authToken gevonden: ${authToken}\n`)

            axios.post("https://inloggen.somtoday.nl/", qs.stringify({
                loginLink: "x",
                "usernameFieldPanel:usernameFieldPanel_body:usernameField": username,
                "passwordFieldPanel:passwordFieldPanel_body:passwordField": password
            }), {
                params: {
                    "-1.-panel-signInForm": "",
                    auth: authToken
                },
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    origin: "https://inloggen.somtoday.nl"
                },
                maxRedirects: 0
            }).catch(async (err: AxiosError) => {
                const authCode = (new URL(err.response!.headers.location!)).searchParams.get("code")
                if (typeof authCode !== "string") {
                    res(false)
                    return console.log("authCode niet gevonden (Fish-o)\n")
                }
                console.log(`authCode gevonden: ${authCode}\n`)

                const token: Token = (await axios.post("https://inloggen.somtoday.nl/oauth2/token", qs.stringify({
                    grant_type: "authorization_code",
                    code: authCode,
                    code_verifier: authVariables.verifier,
                    client_id: CLIENT_ID
                }), {
                    headers: {
                        "content-type": "application/x-www-form-urlencoded"
                    }
                })).data
                if (typeof token === "undefined") {
                    res(false)
                    return console.log("token niet gevonden (Fish-o)\n")
                }
                console.log(`token gevonden: ${JSON.stringify(token)}\n`)
                res(true)
            })
        })
    })

    console.log("\nPOC van 25huizengek1 proberen....")
    const huizenSuccess = await new Promise(res => {
        const client = axios.create({
            withCredentials: true
        })
        const cookies: Array<string> = []
        const authVariables = generateAuthVariables()
        console.log(`authVariables: ${JSON.stringify(authVariables)}`)
        client.get("https://inloggen.somtoday.nl/oauth2/authorize", {
            params: {
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                response_type: "code",
                state: generateRandomString(8),
                scope: "openid",
                tenant_uuid: organization.uuid,
                session: "no_session",
                code_challenge: authVariables.challenge,
                code_challenge_method: "S256"
            },
            maxRedirects: 0,
            validateStatus: s => s == 302
        }).then((response: AxiosResponse) => {
            cookies.push(...response.headers["set-cookie"]!.map(c => (c.split(";")[0])))
            const authToken = (new URL(response.headers.location!)).searchParams.get("auth")
            if (typeof authToken !== "string") {
                res(false)
                return console.log("authToken niet gevonden (25huizengek1)\n")
            }
            console.log(`authToken gevonden: ${authToken}\n`)

            client.post("https://inloggen.somtoday.nl/", qs.stringify({
                loginLink: "x",
                "usernameFieldPanel:usernameFieldPanel_body:usernameField": username
            }), {
                params: {
                    "-1.-panel-signInForm": "",
                    auth: authToken
                },
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    origin: "https://inloggen.somtoday.nl",
                    cookie: cookies.join("; ")
                },
                maxRedirects: 0,
                validateStatus: s => s == 302
            }).then((response: AxiosResponse) => {
                cookies.push(...response.headers["set-cookie"]!.map(c => (c.split(";")[0])))
                client.post("https://inloggen.somtoday.nl/login", qs.stringify({
                    loginLink: "x",
                    "passwordFieldPanel:passwordFieldPanel_body:passwordField": password
                }), {
                    params: {
                        "1-1.-passwordForm": "",
                        auth: authToken
                    },
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        origin: "https://inloggen.somtoday.nl",
                        cookie: cookies.join("; ")
                    },
                    maxRedirects: 0,
                    validateStatus: s => s == 302
                }).then(async (response: AxiosResponse) => {
                    cookies.push(...response.headers["set-cookie"]!.map(c => (c.split(";")[0])))
                    const authCode = (new URL(response.headers.location!)).searchParams.get("code")
                    if (typeof authCode !== "string") {
                        res(false)
                        return console.log("authCode niet gevonden (25huizengek1)\n")
                    }
                    console.log(`authCode gevonden: ${authCode}\n`)

                    const token: Token = (await client.post("https://inloggen.somtoday.nl/oauth2/token", qs.stringify({
                        grant_type: "authorization_code",
                        scope: "openid",
                        client_id: CLIENT_ID,
                        tenant_uuid: organization.uuid,
                        session: "no_session",
                        code: authCode,
                        code_verifier: authVariables.verifier
                    }), {
                        headers: {
                            "content-type": "application/x-www-form-urlencoded",
                            cookie: cookies.join("; ")
                        }
                    })).data
                    if (typeof token === "undefined") {
                        res(false)
                        return console.log("token niet gevonden (25huizengek1)\n")
                    }
                    console.log(`token gevonden: ${JSON.stringify(token)}\n`)
                    res(true)
                })
            })
        })
    })

    console.log(`\nResultaten:\nFish-o: ${fishSuccess}\n25huizengek1: ${huizenSuccess}`)
})()

function generateRandomString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return [...Array(length)].map(() => characters[randomNumber(0, characters.length - 1)]).join("")
}

function randomNumber(min: number = 0, max: number) {
    return Math.floor(Math.random() * max) + min
}

function base64URLEncode(buffer: Buffer) {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function generateAuthVariables() {
    const verifier = base64URLEncode(crypto.randomBytes(32))
    const challenge = base64URLEncode(crypto.createHash("sha256").update(verifier).digest())
    return { verifier, challenge }
}

type Token = {
    access_token: string,
    refresh_token: string,
    somtoday_api_url: string,
    somtoday_oop_url: string,
    scope: string,
    somtoday_tenant: string,
    id_token: string,
    token_type: string,
    expires_in: number
}