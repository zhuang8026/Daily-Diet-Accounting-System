import copy
from mock.users import MOCK_USERS
from mock.foods import MOCK_FOODS
from mock.records import MOCK_RECORDS


class Store:
    def __init__(self):
        self.users: list = copy.deepcopy(MOCK_USERS)
        self.foods: list = copy.deepcopy(MOCK_FOODS)
        self.records: list = copy.deepcopy(MOCK_RECORDS)
        self.announcements: list = []
        self.login_attempts: dict = {}  # email -> {count, locked_until}


store = Store()
