import React from 'react';
import { withFirebase } from '../Firebase';
import Styled from 'styled-components';

const StyledButton = Styled.button`
    background-color: rgb(247,247,247);
    color: rgb(97,97,97);
    border: 1px solid rgb(177,177,177);     
    &:hover {   
    color: rgb(17,17,17);
    border: 1px solid rgb(202,202,202); 
`;

const SignOutButton = ({ firebase }) => (
    <StyledButton type="button" onClick={firebase.doSignOut}>
        Sign Out
    </StyledButton>
);

export default withFirebase(SignOutButton);