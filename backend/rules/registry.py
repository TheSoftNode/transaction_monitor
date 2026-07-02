from typing import Dict, Type, List
from .base import BaseRule


class RuleRegistry:
    _rules: Dict[str, Type[BaseRule]] = {}

    @classmethod
    def register(cls, rule_class: Type[BaseRule]):
        """Register a rule class"""
        cls._rules[rule_class.__name__] = rule_class
        return rule_class

    @classmethod
    def get_rule(cls, rule_name: str) -> Type[BaseRule]:
        """Get a rule class by name"""
        return cls._rules.get(rule_name)

    @classmethod
    def get_all_rules(cls) -> Dict[str, Type[BaseRule]]:
        """Get all registered rules"""
        return cls._rules.copy()

    @classmethod
    def list_rule_names(cls) -> List[str]:
        """List all registered rule names"""
        return list(cls._rules.keys())
