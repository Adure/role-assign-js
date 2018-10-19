const Discord = require('discord.js');
const jsonfile = require('jsonfile');
const auth = require('./auth');
const client = new Discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

function getRoles() {
    let roleList;

    return jsonfile.readFile('./roles.json')
        .then(output => {
            roleList = output.roles;
            return roleList;
        })
        .catch(console.error);
}

function checkRoleExists(rolename, server) {
    var roles = server.roles;
    var role = null;
    try {
        role = roles.find(role => role.name.toUpperCase() === rolename.toUpperCase());
    } finally {
        if (role == null) {
            return false;
        }
        return getRoles()
            .then(roleList => {
                if (roleList.indexOf(rolename) >= 0) {
                    return role;
                } else {
                    return false;
                }
            })
            .catch(console.error);
    }
}

function checkRoleAvailable(rolename, server) {
    var roles = server.roles;
    var role = null;
    try {
        role = roles.find(role => role.name.toUpperCase() === rolename.toUpperCase());
    } finally {
        if (role != null) {
            return false;
        }
        return getRoles()
            .then(roleList => {
                if (roleList.indexOf(rolename) === -1) {
                    return role;
                } else {
                    return false;
                }
            })
            .catch(console.error);
    }
}

function createRole(rolename, colour, server) {
    server.createRole({
        name: rolename,
        color: colour,
    })
        .then(role => {
            console.log(`Created new role with name "${role.name}" and color ${role.color}`)
        })
        .catch(console.error);

    return getRoles()
        .then(roleList => {
            roleList = roleList.concat(rolename);
            let input = {roles: roleList};

            jsonfile.writeFile('./roles.json', input, { spaces: 4, EOL: '\r\n' })
                .then(console.log(`Added "${rolename}" to role list`))
                .catch(console.error);
        return `Created new role with name "${rolename}"`;
        });
}

function assignRole(role, user) {
    if (user.roles.has(role.id)) {
        console.log(`${user.tag} already has role, ${role.name}`);
        return `you already have role, ${role.name}`;
      } else {
        return user.addRole(role)
            .then(success => {
                console.log(`Added role ${role.name} to ${user}`)
                return `Added role ${role.name} to you`;
            })
            .catch(console.error);
      }
}

function deleteRole(rolename, server) {
    let role = server.roles.find(role => role.name === rolename);

    getRoles()
        .then(roleList => {
            let index = roleList.indexOf(rolename);
            roleList.splice(index, 1);
            let input = {roles: roleList};

            jsonfile.writeFile('./roles.json', input, { spaces: 4, EOL: '\r\n' })
                .then(console.log(`Removed role "${role.name}" from list`))
                .catch(console.error);
        })
        .catch(console.error);

    return role.delete()
        .then(outcome => {
            console.log(`Deleted role "${role.name}"`);
            return `Deleted role "${role.name}"`;
        })
        .catch(console.error);
}

function initJson() {
    let input = {roles: []};

    jsonfile.writeFile('./roles.json', input, { spaces: 4, EOL: '\r\n' })
        .then(console.log("Cleared roles.json"))
        .catch(console.error);
}

client.on('message', message => {
    if (message.content.startsWith("/role")) {
        var roleName = message.content.replace("/role", "").trim();
        checkRoleExists(roleName, message.guild)
            .then(checkRole => {
                if (checkRole == false) {
                    message.channel.send("That role doesnt exist");
                    return;
                } else {
                    assignRole(checkRole, message.member)
                        .then(outcome => {
                            message.channel.send(outcome);
                        })
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }

    if (message.content.startsWith("/create")) {
        let messageParts = message.content.match(/(?:[^\s"]+|"[^"]*")+/g);
        var roleName = messageParts[1].replace(/"/g, "");
        var colour = messageParts[2];

        checkRoleAvailable(roleName, message.guild)
            .then(checkRole => {
                if (checkRole == false) {
                    message.channel.send("That role already exists");
                    return;
                }
        
                createRole(roleName, colour, message.guild)
                    .then(outcome => {
                        message.channel.send(outcome);
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }

    if (message.content.startsWith("/delete")) {
        var roleName = message.content.replace("/delete", "").trim();
        checkRoleExists(roleName, message.guild)
            .then(checkRole => {
                if (checkRole == false) {
                    message.channel.send("That role doesn't exist");
                    return;
                }

                deleteRole(roleName, message.guild)
                    .then(outcome => message.channel.send(outcome))
                    .catch(console.error);
            })
            .catch(console.error);
    }

    if (message.content.startsWith("/init")) {
        initJson();
    }
});

client.login(auth.token);