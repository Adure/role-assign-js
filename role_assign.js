const Discord = require('discord.js');
const jsonfile = require('jsonfile');
const auth = require('./auth');
const client = new Discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

async function getRoles() {
    var roleList;

    return jsonfile.readFile('./roles.json')
        .then(output => {
            roleList = output.roles;
            return roleList;
        })
        .catch(console.error);
}

async function checkRoleExists(rolename, server) {
    var roles = server.roles;
    var role = null;
    try {
        role = roles.find(role => role.name.toUpperCase() === rolename.toUpperCase());
    } finally {
        if (role == null) {
            return false;
        }
        return await getRoles()
            .then(async roleList => {
                if (roleList.indexOf(rolename) >= 0) {
                    return role;
                } else {
                    return false;
                }
            })
            .catch(console.error);
    }
}

async function checkRoleAvailable(rolename, server) {
    var roles = server.roles;
    var role = null;
    try {
        role = roles.find(role => role.name.toUpperCase() === rolename.toUpperCase());
    } finally {
        if (role != null) {
            return false;
        }
        return await getRoles()
            .then(async roleList => {
                if (roleList.indexOf(rolename) === -1) {
                    return role;
                } else {
                    return false;
                }
            })
            .catch(console.error);
    }
}

async function createRole(rolename, colour, server) {
    var roleObj;
    server.createRole({
        name: rolename,
        color: colour,
    })
        .then(role => {
            console.log(`Created new role with name ${role.name} and color ${role.color}`)
        })
        .catch(console.error);

    return await getRoles()
        .then(roleList => {
            roleList = roleList.concat(rolename);
            var input = {roles: roleList};

            jsonfile.writeFile('./roles.json', input, { spaces: 4, EOL: '\r\n' })
                .then(console.log(`Added ${rolename} to role list`))
                .catch(console.error);
        return `Created new role with name, ${rolename}.`;
        });
}

async function assignRole(role, user) {
    if (user.roles.has(role.id)) {
        console.log(`${user.tag} already has role, ${role.name}`);
        return `you already have role, ${role.name}`;
      } else {
        return user.addRole(role)
            .then(async success => {
                console.log(`Added role ${role.name} to ${user}`)
                return `Added role ${role.name} to you`;
            })
            .catch(console.error);
      }
}

async function initJson() {
    var input = {roles: []};
    console.log(input);

    await jsonfile.writeFile('./roles.json', input, { spaces: 4, EOL: '\r\n' })
        .catch(console.error);
}

client.on('message', async message => {
    if (message.content.startsWith("/role")) {
        var roleName = message.content.replace("/role", "").trim();
        return await checkRoleExists(roleName, message.guild)
            .then(async checkRole => {
                console.log(checkRole);

                if (checkRole == false) {
                    message.channel.send("That role doesnt exist");
                    return;
                } else {
                    return await assignRole(checkRole, message.member)
                        .then(async outcome => {
                            message.channel.send(outcome);
                        })
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }

    if (message.content.startsWith("/create")) {
        var roleName = message.content.replace("/create", "").trim();
        await checkRoleAvailable(roleName, message.guild)
            .then(async checkRole => {
                if (checkRole == false) {
                    message.channel.send("That role already exists");
                    return;
                }
        
                await createRole(roleName, 'BLUE', message.guild)
                    .then(outcome => {
                        message.channel.send(outcome);
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }

    if (message.content.startsWith("/init")) {
        await initJson();
    }
});

client.login(auth.token);