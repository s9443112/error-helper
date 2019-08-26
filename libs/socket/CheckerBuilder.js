class CheckerBuilder extends require("../http/CheckerBuilder.js") {
    create_middleware_checker() {
        var checkers = this.checkers;

        const CheckerBuilder_checkers = async function (user, ...args) {
            for(var i = 0; i < checkers.length; ++i) {
                var error = await checkers[i].apply(checkers[i], args);
                if(error) {
                    throw error;
                }
            }
        };
        return CheckerBuilder_checkers;
    }
}

module.exports = CheckerBuilder;